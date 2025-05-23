from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
from pyspark.sql.window import Window
from datetime import datetime
import requests
import json
import mysql.connector
from mysql.connector import Error

# Configuración de MySQL
MYSQL_CONFIG = {
    'host': 'db',
    'user': 'root',
    'database': 'resultados_analisis'
}

# Función para conectar a MySQL
def conectar_mysql():
    try:
        connection = mysql.connector.connect(**MYSQL_CONFIG)
        if connection.is_connected():
            return connection
    except Error as e:
        print(f"Error al conectar a MySQL: {e}")
        return None

# Función genérica para insertar datos en MySQL
def insertar_datos_mysql(tabla, datos, columnas):
    connection = conectar_mysql()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        # Limpiar tabla antes de insertar
        cursor.execute(f"TRUNCATE TABLE {tabla}")
        
        # Preparar query de inserción
        placeholders = ', '.join(['%s'] * len(columnas))
        columns_str = ', '.join(columnas)
        query = f"INSERT INTO {tabla} ({columns_str}) VALUES ({placeholders})"
        
        # Insertar datos
        for fila in datos:
            valores = [fila[col] if col in fila else None for col in columnas]
            cursor.execute(query, valores)
        
        connection.commit()
        print(f"Datos insertados en tabla {tabla}: {cursor.rowcount} filas")
        return True
        
    except Error as e:
        print(f"Error al insertar en {tabla}: {e}")
        connection.rollback()
        return False
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

# Inicializar Spark Session
spark = SparkSession.builder.appName('AnalisisTareasAsignadas').getOrCreate()
sc = spark.sparkContext

# LEER DATOS DESDE API
API_URL = "http://appdocker.koreasouth.cloudapp.azure.com:8003/assignedT"

try:
    # Hacer petición GET a la API
    response = requests.get(API_URL)
    response.raise_for_status()
    
    # Convertir respuesta JSON a lista de diccionarios
    data_json = response.json()
    
    print(f"Datos recibidos de la API: {len(data_json)} registros")
    
    # Normalizar los datos antes de crear el DataFrame
    for record in data_json:
        # Convertir campos numéricos a float si no son None
        if record.get('calidad') is not None:
            record['calidad'] = float(record['calidad'])
        if record.get('iniciativa') is not None:
            record['iniciativa'] = float(record['iniciativa'])
        if record.get('comunicacion') is not None:
            record['comunicacion'] = float(record['comunicacion'])
        if record.get('satisfaccion_cliente') is not None:
            record['satisfaccion_cliente'] = float(record['satisfaccion_cliente'])
        if record.get('calificacion_promedio') is not None:
            record['calificacion_promedio'] = float(record['calificacion_promedio'])
    
    # Definir esquema con todos los números como DoubleType
    schema = StructType([
        StructField("id", IntegerType(), True),
        StructField("empleado_id", IntegerType(), True),
        StructField("task_id", IntegerType(), True),
        StructField("fecha_asignacion", StringType(), True),
        StructField("fecha_entrega_maxima", StringType(), True),
        StructField("fecha_entrega", StringType(), True),
        StructField("calidad", DoubleType(), True),
        StructField("iniciativa", DoubleType(), True),
        StructField("comunicacion", DoubleType(), True),
        StructField("satisfaccion_cliente", DoubleType(), True),
        StructField("calificacion_promedio", DoubleType(), True),
        StructField("estado", StringType(), True)
    ])
    
    # Crear DataFrame con esquema explícito
    df_tareas_asignadas = spark.createDataFrame(data_json, schema)
    
    # Convertir fechas de string a timestamp
    df_tareas_asignadas = df_tareas_asignadas \
        .withColumn("fecha_asignacion", 
                   when(col("fecha_asignacion").isNotNull(), 
                        to_timestamp(col("fecha_asignacion"), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"))
                   .otherwise(None)) \
        .withColumn("fecha_entrega_maxima", 
                   when(col("fecha_entrega_maxima").isNotNull(),
                        to_timestamp(col("fecha_entrega_maxima"), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"))
                   .otherwise(None)) \
        .withColumn("fecha_entrega",
                   when(col("fecha_entrega").isNotNull(),
                        to_timestamp(col("fecha_entrega"), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"))
                   .otherwise(None))
    
except requests.exceptions.RequestException as e:
    print(f"Error al conectar con la API: {e}")
    raise
except Exception as e:
    print(f"Error al procesar los datos: {e}")
    raise

# Eliminar duplicados si existen
df_tareas_asignadas = df_tareas_asignadas.dropDuplicates(['id'])

# Crear vista temporal
df_tareas_asignadas.createOrReplaceTempView('tareasasignadas')

print("Columnas de tareasasignadas:")
print(df_tareas_asignadas.columns)
print(f"Total de registros únicos: {df_tareas_asignadas.count()}")

# 1. ANÁLISIS DE RENDIMIENTO POR EMPLEADO
def analizar_rendimiento_empleado(s):
    """Analiza el rendimiento de cada empleado basado en sus tareas asignadas"""
    if s['empleado_id'] is not None and s['estado'] is not None:
        completadas = 1 if s['estado'] == 'Entregado' else 0
        tardias = 1 if s['estado'] == 'Tardio' else 0
        asignadas = 1 if s['estado'] == 'Asignado' else 0
        calif_promedio = float(s['calificacion_promedio']) if s['calificacion_promedio'] else 0.0
        
        return [(s['empleado_id'], (completadas, tardias, asignadas, calif_promedio, 1))]
    return []

# Procesar rendimiento por empleado
rendimiento_empleado = df_tareas_asignadas.filter(df_tareas_asignadas.empleado_id.isNotNull()).rdd.flatMap(
    analizar_rendimiento_empleado
).reduceByKey(
    lambda a, b: (
        a[0] + b[0],  # Total completadas
        a[1] + b[1],  # Total tardías
        a[2] + b[2],  # Total asignadas
        a[3] + b[3],  # Suma calificaciones
        a[4] + b[4]   # Total tareas
    )
)

# Calcular métricas finales
rendimiento_final = rendimiento_empleado.map(
    lambda x: (
        x[0],  # empleado_id
        x[1][0],  # tareas_completadas
        x[1][1],  # tareas_tardias
        x[1][2],  # tareas_asignadas
        x[1][0] + x[1][1] + x[1][2],  # total_tareas
        float(x[1][3] / x[1][4]) if x[1][4] > 0 else 0.0,  # calificacion_promedio
        float((x[1][0] / (x[1][0] + x[1][1] + x[1][2])) * 100) if (x[1][0] + x[1][1] + x[1][2]) > 0 else 0.0  # porcentaje_completadas
    )
)

# Convertir a DataFrame
columns_rendimiento = ['empleado_id', 'tareas_completadas', 'tareas_tardias', 'tareas_asignadas', 
                      'total_tareas', 'calificacion_promedio', 'porcentaje_completadas']
df_rendimiento = rendimiento_final.toDF(columns_rendimiento)

# Redondear después de crear el DataFrame
df_rendimiento = df_rendimiento.withColumn('calificacion_promedio', round(col('calificacion_promedio'), 2))
df_rendimiento = df_rendimiento.withColumn('porcentaje_completadas', round(col('porcentaje_completadas'), 2))

df_rendimiento.show(20)

# Guardar en archivo CSV
df_rendimiento.coalesce(1).write.mode('overwrite').csv('./rendimiento_empleados', header='True')

# Convertir a lista de diccionarios para insertar en MySQL
rendimiento_data = df_rendimiento.collect()
rendimiento_dicts = [row.asDict() for row in rendimiento_data]

# Insertar en MySQL
insertar_datos_mysql('rendimiento_empleados', rendimiento_dicts, columns_rendimiento)

# 2. ANÁLISIS DE CALIDAD POR EMPLEADO
calidad_empleado = spark.sql("""
    SELECT 
        empleado_id,
        AVG(calidad) as calidad_promedio,
        AVG(iniciativa) as iniciativa_promedio,
        AVG(comunicacion) as comunicacion_promedio,
        AVG(satisfaccion_cliente) as satisfaccion_cliente_promedio,
        AVG(calificacion_promedio) as calificacion_general_promedio,
        COUNT(*) as tareas_evaluadas
    FROM tareasasignadas
    WHERE empleado_id IS NOT NULL 
      AND estado = 'Entregado'
      AND calidad IS NOT NULL
    GROUP BY empleado_id
    ORDER BY calificacion_general_promedio DESC
""")

calidad_empleado.show(20)
calidad_empleado.coalesce(1).write.mode('overwrite').csv('./calidad_empleados', header='True')

# Insertar en MySQL
calidad_data = calidad_empleado.collect()
calidad_dicts = [row.asDict() for row in calidad_data]
calidad_columns = ['empleado_id', 'calidad_promedio', 'iniciativa_promedio', 'comunicacion_promedio',
                  'satisfaccion_cliente_promedio', 'calificacion_general_promedio', 'tareas_evaluadas']
insertar_datos_mysql('calidad_empleados', calidad_dicts, calidad_columns)

# 3. ANÁLISIS DE CUMPLIMIENTO DE PLAZOS
cumplimiento_plazos = spark.sql("""
    SELECT 
        empleado_id,
        estado,
        CASE 
            WHEN estado = 'Entregado' AND fecha_entrega <= fecha_entrega_maxima THEN 'A tiempo'
            WHEN estado = 'Entregado' AND fecha_entrega > fecha_entrega_maxima THEN 'Tarde'
            WHEN estado = 'Tardio' THEN 'Muy tarde'
            WHEN estado = 'Asignado' AND CURRENT_TIMESTAMP() > fecha_entrega_maxima THEN 'Vencido'
            ELSE 'En progreso'
        END as estado_cumplimiento
    FROM tareasasignadas
    WHERE empleado_id IS NOT NULL
""")

# Pivot para crear matriz de cumplimiento
matriz_cumplimiento = cumplimiento_plazos.groupBy('empleado_id').pivot('estado_cumplimiento').count().fillna(0)

# Renombrar columnas para MySQL
columnas_matriz = matriz_cumplimiento.columns
datos_matriz = []

for row in matriz_cumplimiento.collect():
    dict_row = row.asDict()
    # Mapear nombres de columnas
    nuevo_dict = {
        'empleado_id': dict_row['empleado_id'],
        'a_tiempo': dict_row.get('A tiempo', 0),
        'tarde': dict_row.get('Tarde', 0),
        'muy_tarde': dict_row.get('Muy tarde', 0),
        'vencido': dict_row.get('Vencido', 0),
        'en_progreso': dict_row.get('En progreso', 0)
    }
    datos_matriz.append(nuevo_dict)

cumplimiento_columns = ['empleado_id', 'a_tiempo', 'tarde', 'muy_tarde', 'vencido', 'en_progreso']
insertar_datos_mysql('cumplimiento_plazos', datos_matriz, cumplimiento_columns)

# 4. ANÁLISIS DE CARGA DE TRABAJO
carga_trabajo = spark.sql("""
    SELECT 
        empleado_id,
        COUNT(*) as total_tareas,
        SUM(CASE WHEN estado = 'Asignado' THEN 1 ELSE 0 END) as tareas_pendientes,
        SUM(CASE WHEN estado = 'Entregado' THEN 1 ELSE 0 END) as tareas_completadas,
        SUM(CASE WHEN estado = 'Tardio' THEN 1 ELSE 0 END) as tareas_tardias,
        AVG(DATEDIFF(fecha_entrega_maxima, fecha_asignacion)) as dias_promedio_asignacion,
        MIN(fecha_asignacion) as primera_asignacion,
        MAX(fecha_asignacion) as ultima_asignacion
    FROM tareasasignadas
    WHERE empleado_id IS NOT NULL
    GROUP BY empleado_id
    ORDER BY total_tareas DESC
""")

carga_trabajo.show(20)
carga_trabajo.coalesce(1).write.mode('overwrite').csv('./carga_trabajo', header='True')

# Insertar en MySQL
carga_data = carga_trabajo.collect()
carga_dicts = [row.asDict() for row in carga_data]
carga_columns = ['empleado_id', 'total_tareas', 'tareas_pendientes', 'tareas_completadas', 
                'tareas_tardias', 'dias_promedio_asignacion', 'primera_asignacion', 'ultima_asignacion']
insertar_datos_mysql('carga_trabajo', carga_dicts, carga_columns)

# 5. ANÁLISIS TEMPORAL DE ENTREGAS
patron_temporal = spark.sql("""
    SELECT 
        empleado_id,
        YEAR(fecha_entrega) as ano,
        MONTH(fecha_entrega) as mes,
        DAYOFWEEK(fecha_entrega) as dia_semana,
        COUNT(*) as cantidad_tareas,
        AVG(calificacion_promedio) as calificacion_promedio,
        AVG(calidad) as calidad_promedio,
        AVG(satisfaccion_cliente) as satisfaccion_promedio
    FROM tareasasignadas
    WHERE estado = 'Entregado' 
      AND fecha_entrega IS NOT NULL
    GROUP BY empleado_id, YEAR(fecha_entrega), MONTH(fecha_entrega), DAYOFWEEK(fecha_entrega)
    ORDER BY empleado_id, ano, mes
""")

patron_temporal.show(20)
patron_temporal.coalesce(1).write.mode('overwrite').csv('./patron_temporal', header='True')

# Insertar en MySQL
temporal_data = patron_temporal.collect()
temporal_dicts = [row.asDict() for row in temporal_data]
temporal_columns = ['empleado_id', 'ano', 'mes', 'dia_semana', 'cantidad_tareas', 
                   'calificacion_promedio', 'calidad_promedio', 'satisfaccion_promedio']
insertar_datos_mysql('patron_temporal', temporal_dicts, temporal_columns)

# 6. ANÁLISIS DE RETRASOS
analisis_retrasos = spark.sql("""
    SELECT 
        empleado_id,
        COUNT(*) as total_tareas_con_retraso,
        AVG(DATEDIFF(fecha_entrega, fecha_entrega_maxima)) as dias_promedio_retraso,
        MAX(DATEDIFF(fecha_entrega, fecha_entrega_maxima)) as max_dias_retraso,
        MIN(DATEDIFF(fecha_entrega, fecha_entrega_maxima)) as min_dias_retraso,
        STDDEV(DATEDIFF(fecha_entrega, fecha_entrega_maxima)) as desviacion_retraso
    FROM tareasasignadas
    WHERE estado IN ('Entregado', 'Tardio') 
      AND fecha_entrega > fecha_entrega_maxima
      AND fecha_entrega IS NOT NULL
    GROUP BY empleado_id
    ORDER BY dias_promedio_retraso DESC
""")

# Manejar casos donde no hay retrasos
if analisis_retrasos.count() > 0:
    analisis_retrasos.show(20)
    retrasos_data = analisis_retrasos.collect()
    retrasos_dicts = [row.asDict() for row in retrasos_data]
else:
    retrasos_dicts = []

retrasos_columns = ['empleado_id', 'total_tareas_con_retraso', 'dias_promedio_retraso', 
                   'max_dias_retraso', 'min_dias_retraso', 'desviacion_retraso']
insertar_datos_mysql('analisis_retrasos', retrasos_dicts, retrasos_columns)

# 7. DISTRIBUCIÓN DE ESTADOS POR EMPLEADO
distribucion_estados = spark.sql("""
    SELECT 
        empleado_id,
        estado,
        COUNT(*) as cantidad
    FROM tareasasignadas
    WHERE empleado_id IS NOT NULL
    GROUP BY empleado_id, estado
    ORDER BY empleado_id, cantidad DESC
""")

# Crear vista pivotada
distribucion_pivot = distribucion_estados.groupBy('empleado_id').pivot('estado').sum('cantidad').fillna(0)

# Preparar datos para MySQL
distribucion_data = []
for row in distribucion_pivot.collect():
    dict_row = row.asDict()
    nuevo_dict = {
        'empleado_id': dict_row['empleado_id'],
        'estado_asignado': dict_row.get('Asignado', 0),
        'estado_entregado': dict_row.get('Entregado', 0),
        'estado_tardio': dict_row.get('Tardio', 0)
    }
    distribucion_data.append(nuevo_dict)

distribucion_columns = ['empleado_id', 'estado_asignado', 'estado_entregado', 'estado_tardio']
insertar_datos_mysql('distribucion_estados', distribucion_data, distribucion_columns)

# 8-10: Continuar con el mismo patrón para las demás tablas...

# ESTADÍSTICAS GENERALES
stats_generales = spark.sql("""
    SELECT 
        COUNT(DISTINCT empleado_id) as total_empleados,
        COUNT(DISTINCT task_id) as total_tareas_unicas,
        COUNT(*) as total_asignaciones,
        AVG(calificacion_promedio) as calificacion_promedio_global,
        SUM(CASE WHEN estado = 'Entregado' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as porcentaje_completado_global
    FROM tareasasignadas
    WHERE empleado_id IS NOT NULL
""")

stats_generales.show()

# Insertar estadísticas generales
stats_data = stats_generales.collect()
stats_dicts = [row.asDict() for row in stats_data]
stats_columns = ['total_empleados', 'total_tareas_unicas', 'total_asignaciones', 
                'calificacion_promedio_global', 'porcentaje_completado_global']
insertar_datos_mysql('estadisticas_generales', stats_dicts, stats_columns)

print("\n=== ANÁLISIS COMPLETADO ===")
print("Datos guardados en archivos CSV y en la base de datos MySQL")

spark.stop()