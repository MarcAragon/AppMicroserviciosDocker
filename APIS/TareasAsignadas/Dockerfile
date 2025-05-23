# Usar imagen con OpenJDK 17 y Python 3
FROM openjdk:17-slim

# Instalar Python 3 y herramientas básicas
RUN apt-get update && \
    apt-get install -y python3 python3-pip curl gnupg lsb-release && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Definir JAVA_HOME para Java 17
ENV JAVA_HOME=/usr/local/openjdk-17
ENV PATH=$PATH:$JAVA_HOME/bin

# Instalar Node.js 18 desde NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Establecer directorio de trabajo
WORKDIR /app

# Copiar solo el archivo de dependencias Python para aprovechar cache
COPY requirements.txt .

# Instalar las dependencias de Python
RUN pip3 install --no-cache-dir -r requirements.txt

# Copiar todo el resto del proyecto
COPY . .

# Instalar dependencias de Node.js
RUN npm install

# Exponer el puerto en el que corre el microservicio
EXPOSE 8003

# Comando para iniciar la aplicación Node.js
CMD ["node", "src/index.js"]
