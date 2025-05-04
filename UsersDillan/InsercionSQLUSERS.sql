DROP DATABASE IF EXISTS userscompany;
CREATE DATABASE /*!32312 IF NOT EXISTS*/ `userscompany` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `userscompany`;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(40) NOT NULL,
  `department` varchar(80) NOT NULL,
  `position` varchar(80) NOT NULL,
  `contract_date` date NOT NULL,
  `role` enum('boss','employee') NOT NULL,
  `user` varchar(25) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user` (`user`),
  UNIQUE KEY `user_2` (`user`),
  UNIQUE KEY `user_3` (`user`),
  UNIQUE KEY `user_4` (`user`),
  UNIQUE KEY `user_5` (`user`)
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Joseph Franco','Marketing','Analista','2021-02-17','employee','user88'),(2,'Sydney Payne','RRHH','Gerente','2021-12-09','boss','user4'),(3,'Eric Kemp','RRHH','Gerente','2021-07-26','boss','user1'),(4,'Lindsey Hall','RRHH','Analista','2023-10-06','boss','user13'),(5,'Daniel Marsh','Marketing','Asistente','2021-04-22','boss','user22'),(6,'Charles Williamson','IT','Gerente','2023-06-27','employee','user771'),(7,'Cynthia Logan','Ventas','Analista','2022-05-23','boss','user25'),(8,'Melissa Jones','Marketing','Gerente','2020-10-23','employee','user181'),(9,'Kathleen Valenzuela','IT','Analista','2024-05-30','employee','user144'),(10,'Jason Poole','RRHH','Analista','2020-06-19','employee','user184'),(11,'Ronald Turner','Ventas','Analista','2024-08-20','employee','user188'),(12,'Shannon Rivera','Marketing','Analista','2024-06-21','employee','user153'),(13,'Wayne Stevens','IT','Desarrollador','2021-09-23','boss','user12'),(14,'Monica Sanders','RRHH','Asistente','2023-08-17','employee','user177'),(15,'Tyrone Gates','RRHH','Desarrollador','2020-05-09','employee','user58'),(16,'Randy Gallagher','Ventas','Asistente','2023-02-11','employee','user207'),(17,'Michelle Peterson','Marketing','Asistente','2021-06-13','employee','user202'),(18,'Nicole Gibson','IT','Gerente','2020-06-28','employee','user154'),(19,'Phillip Harris','IT','Asistente','2023-03-19','employee','user59'),(20,'Linda Brooks','Ventas','Gerente','2024-02-15','employee','user94'),(21,'William Martinez','RRHH','Desarrollador','2023-09-24','employee','user27'),(22,'Annette Kane','RRHH','Gerente','2022-11-23','employee','user57'),(23,'Andrew Thomas','Marketing','Gerente','2021-08-17','employee','user67'),(24,'Roberto Robinson','RRHH','Desarrollador','2021-12-10','boss','user17'),(25,'Kimberly Taylor','RRHH','Desarrollador','2022-10-06','employee','user237'),(26,'Ashley Pitts','IT','Asistente','2024-02-09','employee','user91'),(27,'Thomas Humphrey','IT','Desarrollador','2022-10-16','employee','user30'),(28,'Debbie Murray','Ventas','Analista','2023-05-16','employee','user77'),(29,'Scott Cooper','IT','Analista','2021-04-25','employee','user252'),(30,'David George','IT','Desarrollador','2023-10-11','boss','user6'),(31,'Carol Ritter','Marketing','Analista','2024-05-30','employee','user52'),(32,'James Garrison','RRHH','Asistente','2020-11-28','employee','user38'),(33,'Misty Faulkner','RRHH','Desarrollador','2022-08-24','employee','user107'),(34,'Matthew Garcia','Marketing','Gerente','2023-04-22','employee','user43'),(35,'Charles Long','RRHH','Asistente','2022-09-27','employee','user109'),(36,'Clarence Hughes','Ventas','Desarrollador','2024-08-25','employee','user100'),(37,'Christopher Owens','RRHH','Asistente','2022-06-27','employee','user246'),(38,'Melanie Wilson','RRHH','Gerente','2022-02-22','employee','user56'),(39,'Kristen Adams','Ventas','Analista','2023-02-21','employee','user136'),(40,'Kevin Roth','Marketing','Analista','2020-09-08','boss','user8'),(41,'John Flores','RRHH','Analista','2021-05-10','employee','user68'),(42,'Timothy Love','RRHH','Analista','2021-12-12','employee','user69'),(43,'David Lane','Marketing','Desarrollador','2021-11-04','employee','user131'),(44,'Kelly Hayes','IT','Desarrollador','2025-02-28','employee','user345'),(45,'David Hall','Ventas','Analista','2021-09-21','employee','user71'),(46,'Anthony Beck','IT','Analista','2020-03-26','employee','user28'),(47,'Kara Mckee','Marketing','Asistente','2021-07-21','employee','user175'),(48,'Leroy Wagner','RRHH','Desarrollador','2024-09-21','employee','user222'),(49,'Samuel Walker','RRHH','Gerente','2022-05-14','employee','user29'),(50,'Rebecca Pennington','Ventas','Desarrollador','2020-08-17','boss','user3'),(51,'Desiree Guzman','Ventas','Gerente','2023-06-24','employee','user62'),(52,'Virginia Carr','IT','Asistente','2022-11-29','employee','user61'),(53,'Tony Mcgrath','Ventas','Asistente','2022-04-29','employee','user31'),(54,'Lisa Randall','RRHH','Gerente','2024-07-19','employee','user165'),(55,'John Mckee','Ventas','Asistente','2020-06-07','boss','user7'),(56,'Kenneth Johnson','RRHH','Asistente','2021-05-02','employee','user359'),(57,'Michael Knight','Ventas','Desarrollador','2022-06-13','employee','user269'),(58,'Nicole Lucas','IT','Asistente','2023-07-13','employee','user32'),(59,'Albert Monroe','RRHH','Gerente','2023-08-11','employee','user97'),(60,'Craig Pierce','Ventas','Analista','2022-08-10','employee','user41'),(61,'Linda Roman','Ventas','Asistente','2020-05-22','employee','user70'),(62,'Eddie Herrera','IT','Desarrollador','2023-07-28','employee','user33'),(63,'Robert King','Marketing','Analista','2020-05-29','boss','user11'),(64,'John Williams','Ventas','Asistente','2021-03-22','employee','user75'),(65,'Ashley Jackson','IT','Gerente','2023-03-16','employee','user343'),(66,'Leonard Ayala','IT','Gerente','2022-10-11','boss','user15'),(67,'Andrew Nelson','RRHH','Desarrollador','2024-09-16','employee','user198'),(68,'Pamela Jenkins','Ventas','Analista','2022-06-21','employee','user127'),(69,'Tiffany Ray','Marketing','Analista','2021-01-11','employee','user124'),(70,'Dustin Mathews','IT','Gerente','2023-02-19','employee','user46'),(71,'Brian Hood','Marketing','Analista','2023-07-03','employee','user26'),(72,'Ryan Krause','IT','Analista','2024-11-12','employee','user164'),(73,'John Nash','IT','Desarrollador','2023-05-30','employee','user37'),(74,'Amy Morgan','Marketing','Gerente','2022-12-11','employee','user36'),(75,'Michael Edwards','RRHH','Analista','2024-05-28','employee','user54'),(76,'Kelli Santiago','Marketing','Asistente','2021-11-15','employee','user185'),(77,'Omar Howell','Ventas','Analista','2021-01-09','boss','user18'),(78,'Roger Martin','IT','Desarrollador','2022-07-08','boss','user10'),(79,'Stephanie Fitzpatrick','Marketing','Desarrollador','2022-12-09','employee','user79'),(80,'Sean Mann','IT','Desarrollador','2024-10-02','employee','user34'),(81,'Wayne Bell','RRHH','Gerente','2022-06-26','boss','user21'),(82,'Alexis Sharp','Marketing','Analista','2020-12-25','employee','user73'),(83,'Anthony Moreno','Ventas','Desarrollador','2023-08-16','employee','user115'),(84,'Richard Rodgers','Ventas','Desarrollador','2024-03-15','employee','user40'),(85,'Scott Gray','RRHH','Desarrollador','2021-02-10','employee','user44'),(86,'Alyssa Lee','RRHH','Gerente','2023-02-20','boss','user14'),(87,'Robert Juarez','IT','Asistente','2021-12-20','employee','user195'),(88,'Christopher Walker','RRHH','Desarrollador','2022-11-27','employee','user253'),(89,'Andrew Evans','IT','Gerente','2021-06-14','boss','user24'),(90,'Courtney Sampson','RRHH','Desarrollador','2021-02-07','boss','user5'),(91,'Whitney Williams','Marketing','Asistente','2024-09-24','boss','user2'),(92,'Kelly Strong','Ventas','Desarrollador','2022-04-17','employee','user64'),(93,'Robert Woods','IT','Analista','2022-07-29','employee','user129'),(94,'Melissa Young','Ventas','Analista','2021-07-04','employee','user135'),(95,'Jessica Martin','Ventas','Desarrollador','2024-02-12','employee','user114'),(96,'Scott Smith','RRHH','Desarrollador','2022-03-29','employee','user248'),(97,'Michael Smith','RRHH','Desarrollador','2023-08-18','employee','user42'),(98,'Victoria Brown','Ventas','Asistente','2022-06-29','employee','user548'),(99,'Walter Flores','IT','Gerente','2021-05-13','employee','user143'),(100,'Laura Green','Marketing','Analista','2022-02-20','employee','user104');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE*/;
/*!50606 SET GLOBAL INNODB_STATS_AUTO_RECALC=@OLD_INNODB_STATS_AUTO_RECALC */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

USE userscompany;
SELECT * FROM users;

-- Dump completed on 2025-03-22 20:18:35