# Usar imagen con OpenJDK 11 y Python 3.10
FROM openjdk:11-slim

# Instalar Python 3 y herramientas básicas
RUN apt-get update && \
    apt-get install -y python3 python3-pip curl gnupg lsb-release nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Definir JAVA_HOME
ENV JAVA_HOME=/usr/local/openjdk-11
ENV PATH=$PATH:$JAVA_HOME/bin

# Instalar Node.js 18 desde NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar solo el archivo de dependencias primero para aprovechar cache
COPY requirements.txt .

# Instalar las dependencias Python
RUN pip3 install --no-cache-dir -r requirements.txt

# Copiar todo el resto del proyecto
COPY . .

# Instalar dependencias de Node
RUN npm install

EXPOSE 8003

CMD ["node", "src/index.js"]
