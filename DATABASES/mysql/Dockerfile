FROM mysql

ENV MYSQL_ALLOW_EMPTY_PASSWORD=yes
ENV MYSQL_ROOT_HOST='%'

COPY init.sql /docker-entrypoint-initdb.d/

EXPOSE 3306
