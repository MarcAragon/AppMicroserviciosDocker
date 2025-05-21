import pyspark 
from pyspark.sql import SparkSession

spark = SparkSession.builder.appName('Redes').getOrCreate()
df = spark.read.csv('/root/AppMicroserviciosDocker/df_company/*csv', header='True', inferSchema='True')
sc = spark.sparkContext

df.show()
def procesar(s):
  if s['status'] == 'Completed' and s['boss_name'] != None:
    return [(s['boss_name'], (1, 0, 0))]
  elif s['status'] == 'Created' and s['boss_name'] != None:
    return [(s['boss_name'], (0, 1, 0))]
  elif s['status'] == 'In Progress' and s['boss_name'] != None:
    return [(s['boss_name'], (0, 0, 1))]
  else: 
    return []

process = df.rdd.flatMap(procesar).reduceByKey(lambda a, b: (
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2]
) )

process = process.collect()
process = [(i[0], i[1][0], i[1][1], i[1][2]) for i in process]
process = sc.parallelize(process)

columnsNames = ['boss_name', 'empleados_tareas_completada', 'empleados_tareas_creadas', 'empleados_tareas_en_progreso']
dataProcces = process.toDF(columnsNames)
dataProcces.show()

dataProcces.coalesce(1).write.mode('overwrite').csv('procesamiento_data/resultados', header='True')

df.createOrReplaceTempView('data')

tareas = spark.sql('SELECT idTarea, idProyecto, nombreProyecto, idJefe, nombreTarea, prioridad FROM data')
tareas.show()
tareas.coalesce(1).write.mode('overwrite').csv('/root/AppMicroserviciosDocker/resultados/tareas', header='True')

tareasAsignadas = spark.sql('SELECT id, empleado_id, task_id, fecha_asignacion, fecha_entrega_maxima, fecha_entrega, calidad, iniciativa, comunicacion, satisfaccion_cliente, calificacion_promedio, estado FROM data')
tareasAsignadas.show()
tareasAsignadas.coalesce(1).write.mode('overwrite').csv('/root/AppMicroserviciosDocker/resultados/tareasAsignadas', header='True')

proyectos = spark.sql('SELECT project_id, project_name, boss_id, boss_name, status, REPLACE(team_members, ",", ";") as team_members FROM data')
proyectos.coalesce(1).write.mode('overwrite').csv('/content/resultados/proyectos', header='True')
proyectos.show()
proyectos.coalesce(1).write.mode('overwrite').csv('/root/AppMicroserviciosDocker/resultados/proyectos', header='True')
