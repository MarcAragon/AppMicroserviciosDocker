FROM python:3.10-slim

# Eliminar repositorios duplicados y agregar OpenJDK 11 de OpenJDK
RUN apt-get update && \
    apt-get install -y curl gnupg lsb-release && \
    echo "deb http://deb.debian.org/debian bullseye main" > /etc/apt/sources.list.d/debian.list && \
    apt-get update && \
    apt-get install -y openjdk-11-jdk && \
    apt-get clean

# Definir JAVA_HOME
ENV JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
ENV PATH=$PATH:$JAVA_HOME/bin

# Instalar Node.js y dependencias de Python
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

RUN pip install pyspark flask requests mysql-connector-python

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 8003

CMD ["node", "src/index.js"]