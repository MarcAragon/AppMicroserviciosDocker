
# Acerca de 

Plataforma de asignación y revisión de tareas para una empresa, clúster de procesamiento y analisis de de datos a gran escala con herramientas de visualización. 

# Herramientas usadas

- Docker
- Apache Pyspark
- NodeJS
- MySQL
# Implementación

El unico requisito para la implementación es tener docker instalado. Puede hacerlo siguiendo las guias de: https://docs.docker.com/desktop/.

## Despliegue

Para desplegar este proyecto primero se descarga el archivo y se elije el metodo de despliegue. El por defecto es con Docker Compose, en caso de optar por orquestación, añadiendo replicas y ejecutando en nodos distribuidos, ejecute con Docker Swarm:

#### Se hace el pull del archivo

```bash
  mkdir "tu_carpeta"
  cd "tu_carpeta"
  git init
  git remote add origin https://github.com/MarcAragon/AppMicroserviciosDocker.git
  git sparse-checkout init --cone
  git sparse-checkout docker-compose.yml
  git pull origin main
```

Después se ejecuta con docker compose o swarm dependiendo de lo elegido.

#### Docker Compose:

```docker
docker compose -f docker-compose.yml up -d
```

#### Docker Swarm: 

Puede ejecutar el Docker stack y manualmente escalar cada servicio a su comodidad de esta forma.

```docker 
docker swarm init
docker stack deploy -c docker-compose.yml nombrestack
docker service scale nombrestack_servicio=2
```

O puede predefinir las instancias de cada servicio. Antes de ejecutar en swarm, dependiendo de las limitaciones del hardware propio reemplace la cantidad de replicas de cada servicio a su necesidad.

```docker 
services:
  db:
    image: steven462/db:v1
    ports: 
      - "3333:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root"]
      interval: 10s
      timeout: 10s
      retries: 10
    deploy:
      replicas: 1


  proyectos:
    image: steven462/proyectos:v1
    depends_on:
      - db
      - usuarios
    ports:
      - "8001:8001"
    deploy:
      replicas: 5


  tareas:
    image: steven462/tareas:v1
    depends_on:
      - db
      - proyectos
    ports:
      - "8002:8002"
    deploy:
      replicas: 5


      
  tareasasignadas:
    image: steven462/tareasasignadas:v1
    depends_on:
      - db
      - usuarios
      - proyectos
    ports:
      - "8003:8003"
    deploy:
      replicas: 20



  usuarios:
    image: steven462/users:v1
    depends_on:
      - db
    ports:
      - "8000:8000"
    deploy:
      replicas: 5


  web:
    image: steven462/front:v1
    ports:
      - "8080:80"
    deploy:
      replicas: 2
```

Ahora despligue con:

```docker 
docker swarm init
docker stack deploy -c docker-compose.yml nombrestack
```

La aplicación se despliega en la dirección de dns de la maquina virtual appdocker.koreasouth.cloudapp azure.com en el puerto 8080.
