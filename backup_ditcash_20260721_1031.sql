-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: ditcash_db
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `BodegaConfig`
--

DROP TABLE IF EXISTS `BodegaConfig`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `BodegaConfig` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_bodega_araujo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `es_principal` tinyint(1) NOT NULL DEFAULT '0',
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `BodegaConfig_id_bodega_araujo_key` (`id_bodega_araujo`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `BodegaConfig`
--

LOCK TABLES `BodegaConfig` WRITE;
/*!40000 ALTER TABLE `BodegaConfig` DISABLE KEYS */;
INSERT INTO `BodegaConfig` VALUES (1,'1',1,'2026-07-02 15:28:02.998'),(2,'2',1,'2026-07-02 15:28:03.397'),(3,'7',0,'2026-07-02 15:28:03.701'),(4,'8',0,'2026-07-02 15:28:03.941'),(5,'9',0,'2026-07-02 15:28:04.181');
/*!40000 ALTER TABLE `BodegaConfig` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Canje`
--

DROP TABLE IF EXISTS `Canje`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Canje` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vendedorId` int NOT NULL,
  `premioId` int NOT NULL,
  `estado` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `urlEvidencia` text COLLATE utf8mb4_unicode_ci,
  `publicIdEvidencia` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Canje_vendedorId_fkey` (`vendedorId`),
  KEY `Canje_premioId_fkey` (`premioId`),
  CONSTRAINT `Canje_premioId_fkey` FOREIGN KEY (`premioId`) REFERENCES `Premio` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Canje_vendedorId_fkey` FOREIGN KEY (`vendedorId`) REFERENCES `vendedores` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Canje`
--

LOCK TABLES `Canje` WRITE;
/*!40000 ALTER TABLE `Canje` DISABLE KEYS */;
INSERT INTO `Canje` VALUES (1,2,2,'entregado','https://res.cloudinary.com/dlvmo3axh/image/upload/v1783007679/ditcash_entregas_evidencias/zbzck2i0mxj1dgnnbfol.jpg','ditcash_entregas_evidencias/zbzck2i0mxj1dgnnbfol','2026-07-02 15:53:44.661'),(2,2,2,'entregado','https://res.cloudinary.com/dlvmo3axh/image/upload/v1783007688/ditcash_entregas_evidencias/rhh3touzbq2ltcdtudul.jpg','ditcash_entregas_evidencias/rhh3touzbq2ltcdtudul','2026-07-02 15:53:52.617'),(3,12,9,'entregado','https://res.cloudinary.com/dlvmo3axh/image/upload/v1783010645/ditcash_entregas_evidencias/o8hszhc9sqzhsxo2oskh.jpg','ditcash_entregas_evidencias/o8hszhc9sqzhsxo2oskh','2026-07-02 16:43:26.266'),(4,6,24,'rechazado',NULL,NULL,'2026-07-02 20:21:00.016');
/*!40000 ALTER TABLE `Canje` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Evidencia`
--

DROP TABLE IF EXISTS `Evidencia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Evidencia` (
  `id` int NOT NULL AUTO_INCREMENT,
  `urlImagen` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `publicId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `clienteNombre` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vendedorId` int NOT NULL,
  `campanaId` int NOT NULL,
  `valorPagado` double NOT NULL DEFAULT '2',
  `estado` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `motivoRechazo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imageHash` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Evidencia_imageHash_key` (`imageHash`),
  KEY `Evidencia_vendedorId_fkey` (`vendedorId`),
  KEY `Evidencia_campanaId_fkey` (`campanaId`),
  CONSTRAINT `Evidencia_campanaId_fkey` FOREIGN KEY (`campanaId`) REFERENCES `campanas` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Evidencia_vendedorId_fkey` FOREIGN KEY (`vendedorId`) REFERENCES `vendedores` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Evidencia`
--

LOCK TABLES `Evidencia` WRITE;
/*!40000 ALTER TABLE `Evidencia` DISABLE KEYS */;
INSERT INTO `Evidencia` VALUES (1,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783011724/ditcash_evidencias/woh7hr1h4cb3mxsi8mzg.jpg','ditcash_evidencias/woh7hr1h4cb3mxsi8mzg','Más videos \"4\"',6,3,100,'aprobado',NULL,'dc090fc608e49e03d200143ae97a1cb274a25cd405ee15af1d41c8a347e7f007','2026-07-02 17:02:05.362'),(2,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783011868/ditcash_evidencias/da8hbd3c3atd6h3ttyk4.jpg','ditcash_evidencias/da8hbd3c3atd6h3ttyk4','video ganador más vistas',1,3,100,'aprobado',NULL,'64cdb0ab3977e23607c8231af1cbb034a0459a06be0b31417cf4f01be9ccb884','2026-07-02 17:04:28.538'),(3,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783013242/ditcash_evidencias/kqk9earhrobpwsfpgj7f.jpg','ditcash_evidencias/kqk9earhrobpwsfpgj7f','Nase tserump',12,2,1.5,'aprobado',NULL,'a8156507244b011c7446ec77c4acd2c7737849eb8b1964902713d73c4cf2589e','2026-07-02 17:27:24.498'),(4,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783013302/ditcash_evidencias/xtqdw4cvd8pns1glcwez.jpg','ditcash_evidencias/xtqdw4cvd8pns1glcwez','Norma Chumap ',12,2,1.5,'aprobado',NULL,'a9ae5d557d5d082b61c406ca536ba9d35855a16a8f14db1777f6dae1c746238b','2026-07-02 17:28:24.231'),(5,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783013362/ditcash_evidencias/jtnupcfxgmfu5ssvmxwd.jpg','ditcash_evidencias/jtnupcfxgmfu5ssvmxwd','Aida taant',12,2,1.5,'aprobado',NULL,'076da8b33663f3bc640f257227e114575dc521a2ff570b026db5e955f8f1745d','2026-07-02 17:29:24.614'),(6,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783013469/ditcash_evidencias/elu57bsgiclz2kyfzquh.jpg','ditcash_evidencias/elu57bsgiclz2kyfzquh','Rosa shiram',12,2,1.5,'aprobado',NULL,'ffee85d0e0a046aa42a074982b8faaf8936d146f6a0d11e039b06892998f616f','2026-07-02 17:31:11.222'),(7,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783181848/ditcash_evidencias/t4m41zprowi284kgyn13.jpg','ditcash_evidencias/t4m41zprowi284kgyn13','María papue ',12,2,1.5,'aprobado',NULL,'7ffa2f0ca52df7b779035253810ce7c88e675bc42f2a41420ecd17140c97ed1a','2026-07-04 16:17:29.789'),(8,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783181870/ditcash_evidencias/oepihnw55edlddytm3lo.jpg','ditcash_evidencias/oepihnw55edlddytm3lo','Fernanda shiriam',12,2,1.5,'aprobado',NULL,'e446f20633a7d850a7f7f34110786007d2e62e8dcfc4288cbd79c79de57bc5ab','2026-07-04 16:17:52.272'),(9,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783181906/ditcash_evidencias/f4wmuljliixw7ybii10q.jpg','ditcash_evidencias/f4wmuljliixw7ybii10q','Margarita tuniak',12,2,1.5,'aprobado',NULL,'a9aaef53b2cb783906afe9d7c343477181a4c617c444bdff265e12c45f1b6303','2026-07-04 16:18:27.867'),(10,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783181952/ditcash_evidencias/w4rga1gbjvdvjbferyr4.jpg','ditcash_evidencias/w4rga1gbjvdvjbferyr4','Maritza kaika',12,2,1.5,'aprobado',NULL,'09620114ad1bc7568d9e2a0c9bdd2642bc967426efc4bb35d550245f98d4201a','2026-07-04 16:19:13.536'),(11,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783181976/ditcash_evidencias/j6ul7x35u7bea6fk3svi.jpg','ditcash_evidencias/j6ul7x35u7bea6fk3svi','Jaime',12,2,1.5,'aprobado',NULL,'e23d63dd2cb61245802b8430bd98d8be365a6a6f82dcc49ddb7371a66279275a','2026-07-04 16:19:37.224'),(12,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783182000/ditcash_evidencias/dtepjryamq8frfsosjir.jpg','ditcash_evidencias/dtepjryamq8frfsosjir','Rafael puntiak',12,2,1.5,'aprobado',NULL,'64fcdd41a8373cc5a5b38a67e4d0db1ffc156d6f908ac010f392886276db12bd','2026-07-04 16:20:01.485'),(13,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783182074/ditcash_evidencias/cq2iyws0y86lzb1pw5vt.jpg','ditcash_evidencias/cq2iyws0y86lzb1pw5vt','Unidad educativa pania ',12,2,1.5,'aprobado',NULL,'c3421cec8c6b5aa9f7f18046e41624dbcc50fef3fec1fb6cea4a6aa026a16450','2026-07-04 16:21:15.259'),(14,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783539371/ditcash_evidencias/yb8hdl5cuvvjnovqsxuh.jpg','ditcash_evidencias/yb8hdl5cuvvjnovqsxuh','venta motosierra 680',11,1,50,'aprobado',NULL,'a099c6660cffbefe148ef81179e7a93950dfc2eb0eb39f988c8bd703520b0dfd','2026-07-08 19:36:13.256'),(22,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783963605/ditcash_evidencias/osmuoatnuv7wv0xhfxyd.jpg','ditcash_evidencias/osmuoatnuv7wv0xhfxyd','CARMITA SAMBRANO',6,2,1.5,'aprobado',NULL,'8f58b49bc6828c9975524307af7f610b4f568b25a88e76e9c271083aa423d70d','2026-07-13 17:26:46.491'),(23,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783963622/ditcash_evidencias/wgtfbcs8l3svhsditcem.jpg','ditcash_evidencias/wgtfbcs8l3svhsditcem','SALOME SHIGUANGO',6,2,1.5,'aprobado',NULL,'78234ffba8d9bed94a661a296d9db08aa8695e5a83c3de6b0ecaac63d4d8381c','2026-07-13 17:27:03.787'),(24,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783963642/ditcash_evidencias/zkusscyib4baummzcfis.jpg','ditcash_evidencias/zkusscyib4baummzcfis','CARLOS SHIGUANGO',6,2,1.5,'aprobado',NULL,'3df683a881bd554fa6481467c1acd308b1e8a5de6c50553d6d312d865caff049','2026-07-13 17:27:23.307'),(25,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783963659/ditcash_evidencias/eqx5eio2ngfo09l3gbab.jpg','ditcash_evidencias/eqx5eio2ngfo09l3gbab','OSVALDO',6,2,1.5,'aprobado',NULL,'c569cda28e6b3b2832257d22f8a311b6a4507f1f0ccdc8983fcc1286776c4b36','2026-07-13 17:27:40.290'),(26,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783963692/ditcash_evidencias/rjxbq2lritll5tnfisy5.jpg','ditcash_evidencias/rjxbq2lritll5tnfisy5','CARLOS CERDA',6,2,1.5,'aprobado',NULL,'edd1cd90ea52c8bb540eddccd08d6c5e821edfcaf485e2fe62f4f4ac64edeccb','2026-07-13 17:28:13.602'),(27,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783983688/ditcash_evidencias/a7dqhgppskm59uescnah.jpg','ditcash_evidencias/a7dqhgppskm59uescnah','Paushiyacu',1,2,1.5,'aprobado',NULL,'937477d9f309080121399c5b7468b47633e954252761ad3862cb6759a60bc1fa','2026-07-13 23:01:29.421'),(28,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1784066959/ditcash_evidencias/uwdnzqzclsqkcrmx9tjt.jpg','ditcash_evidencias/uwdnzqzclsqkcrmx9tjt','Victor cornejo',12,2,1.5,'aprobado',NULL,'544f186c5df25fe1097df6798de482f0e8dba08e428f9410c5c4386b42eb5e4a','2026-07-14 22:09:21.362'),(29,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1784067185/ditcash_evidencias/mlsaqjaf7991fwarq5rb.jpg','ditcash_evidencias/mlsaqjaf7991fwarq5rb','Nathaly',12,2,1.5,'aprobado',NULL,'603a758649e86dcde42f59b99c676955d3b0a0024ea6f0881f497ac642de4f30','2026-07-14 22:13:06.760');
/*!40000 ALTER TABLE `Evidencia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Premio`
--

DROP TABLE IF EXISTS `Premio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Premio` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `puntos` double NOT NULL,
  `urlImagen` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `publicId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stock` int NOT NULL DEFAULT '1',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `reservado` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Premio`
--

LOCK TABLES `Premio` WRITE;
/*!40000 ALTER TABLE `Premio` DISABLE KEYS */;
INSERT INTO `Premio` VALUES (1,'ALEXA ECHO POP','ALEXA ECHO POP',160,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783004219/ditcash_premios/hs0e0a9aoqpnbzpxt0fl.png','ditcash_premios/hs0e0a9aoqpnbzpxt0fl',1,1,0,'2026-07-02 14:57:00.183'),(2,'BALON','BALON INDOR FUTBOL',30,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783004291/ditcash_premios/vzfk45wxrxxym7x0yy8n.png','ditcash_premios/vzfk45wxrxxym7x0yy8n',1,1,0,'2026-07-02 14:58:13.252'),(3,'BATIDORA B+D DE MANOS','BATIDORA B+D DE MANOS 5VEL + TURBO',70,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783004845/ditcash_premios/qza3r5mjbyg8ikirnzox.png','ditcash_premios/qza3r5mjbyg8ikirnzox',1,1,0,'2026-07-02 15:07:26.598'),(4,'PROCESADOR DE ALIMENTOS Y LLICUADORA','PROCESADOR DE ALIMENTOS Y LLICUADORA B&D 2 EN 1',320,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783004993/ditcash_premios/tkrpojymaxtnjepdcxmc.jpg','ditcash_premios/tkrpojymaxtnjepdcxmc',1,1,0,'2026-07-02 15:09:54.141'),(5,'CHALECOS','CHALECO DITEC',20,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783005077/ditcash_premios/epqdsfzclakcyy1w9zhz.jpg','ditcash_premios/epqdsfzclakcyy1w9zhz',1,1,0,'2026-07-02 15:11:19.529'),(6,'COCINA HACEB 6Q','COCINA HACEB 6Q OREGANO A GAS CON HORNO PARRILLA GRUESA',475,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783005187/ditcash_premios/coe1z4ysq5giwav4msru.png','ditcash_premios/coe1z4ysq5giwav4msru',1,1,0,'2026-07-02 15:13:09.602'),(7,'CORTADOR DE CABELLO','CORTADOR DE CABELLO REMINGTON CON PALANCA AJUSTABLE',130,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783005263/ditcash_premios/itzalqqrehof61shah5h.png','ditcash_premios/itzalqqrehof61shah5h',1,1,0,'2026-07-02 15:14:24.689'),(8,'DESMALEZADORA SHINDAIWA B451','DESMALEZADORA SHINDAIWA B451',1290,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783005342/ditcash_premios/ccuuci2hg0gzb82drwzf.png','ditcash_premios/ccuuci2hg0gzb82drwzf',1,1,0,'2026-07-02 15:15:44.573'),(9,'EDREDON','EDREDON',30,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783005394/ditcash_premios/cvcgjeent5in2gbyhl7q.png','ditcash_premios/cvcgjeent5in2gbyhl7q',1,1,0,'2026-07-02 15:16:36.499'),(10,'REFIRGERADORA HISENSE 179 LTS','REFIRGERADORA HISENSE 179 LTS PLATA',680,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783013107/ditcash_premios/shukl1vir2eru06nlpcg.jpg','ditcash_premios/shukl1vir2eru06nlpcg',1,1,0,'2026-07-02 17:25:07.715'),(11,'FUMIGADORA LAMBORGINI','FUMIGADORA LAMBORGINI MOCHILA 20 LTS L3200SPS2',950,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783013224/ditcash_premios/xy6fdhmerysudzjywewm.png','ditcash_premios/xy6fdhmerysudzjywewm',1,1,0,'2026-07-02 17:27:05.511'),(12,'LAPTOP ACER RYZEN 7','LAPTOP ACER RYZEN 7 ASP AL 15-41P 5700U 16GB 512GB SSD 15.6\"',2050,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783013335/ditcash_premios/kfb57uf3jx9evbxjjvgi.png','ditcash_premios/kfb57uf3jx9evbxjjvgi',1,1,0,'2026-07-02 17:28:56.585'),(13,'LAVADORA INNOVA DOBLE TANQUE','LAVADORA INNOVA DOBLE TANQUE 19KG SEMI-AUTOMATICA',720,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783013442/ditcash_premios/qm9qtmwcodqzbmnzlct4.png','ditcash_premios/qm9qtmwcodqzbmnzlct4',1,1,0,'2026-07-02 17:30:43.643'),(14,'LICUADORA ECHEF PRO','LICUADORA ECHEF PRO 700W 3VL 1.25LT CLASICA',110,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783013527/ditcash_premios/tznf0n5pnndlnahctapq.png','ditcash_premios/tznf0n5pnndlnahctapq',1,1,0,'2026-07-02 17:32:08.065'),(15,'MINIBAR INNOVA 1 PUERTA','MINIBAR INNOVA 1 PUERTA 92 LTS NEGRO',490,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783013592/ditcash_premios/xwgj0iguuo5qkdbeadza.png','ditcash_premios/xwgj0iguuo5qkdbeadza',1,1,0,'2026-07-02 17:33:13.793'),(16,'MOTOSIERRA CS 680-70','MOTOSIERRA AGROTA CS 680-70',1761,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783013669/ditcash_premios/o49f54ehxlc1wbdy8ere.png','ditcash_premios/o49f54ehxlc1wbdy8ere',1,1,0,'2026-07-02 17:34:30.151'),(17,'OLLA DE PRESION MULTIFUNCION','OLLA DE PRESION MULTIFUNCION 5.7LTS B&D',215,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783013816/ditcash_premios/jomrltnbvyafo9qzy57l.jpg','ditcash_premios/jomrltnbvyafo9qzy57l',1,1,0,'2026-07-02 17:36:57.569'),(18,'PLANCHA A VAPOR B&D','PLANCHA A VAPOR B&D CON SUELA ANTIADHERENTE',60,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783013935/ditcash_premios/wsa9n9zoxrh7zcekjvhr.jpg','ditcash_premios/wsa9n9zoxrh7zcekjvhr',1,1,0,'2026-07-02 17:38:55.984'),(19,'PROCESADOR DE ALIMENTOS B&D','PROCESADOR DE ALIMENTOS B&D DE 8 TAZAS',203,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783015437/ditcash_premios/eeqbo6fywkpk8q4leb5l.jpg','ditcash_premios/eeqbo6fywkpk8q4leb5l',1,1,0,'2026-07-02 18:03:58.125'),(20,'SET DE OLLAS KAISA VILLA','SET DE OLLAS KAISA VILLA 12PCS CON TETERA',300,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783015542/ditcash_premios/qr805hppkncblraq0klm.jpg','ditcash_premios/qr805hppkncblraq0klm',1,1,0,'2026-07-02 18:05:42.723'),(21,'TELEVISOR INNOVA LED 65\"','TELEVISOR INNOVA LED 65\" GOOGLE CONTROL DE VOZ',1700,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783015616/ditcash_premios/n3hx6e36f5r49iqyz6vh.jpg','ditcash_premios/n3hx6e36f5r49iqyz6vh',1,1,0,'2026-07-02 18:06:57.430'),(22,'TELEVISOR INNOVA LED 32\"','TELEVISOR INNOVA LED 32\" GOOGLE TV HD CONTROL VOZ',470,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783015702/ditcash_premios/khjz1rgktdr8tvplcq8k.png','ditcash_premios/khjz1rgktdr8tvplcq8k',1,1,0,'2026-07-02 18:08:23.123'),(23,'TELEVISOR INNOVA LED 43\"','TELEVISOR INNOVA LED 43\" GOOGLE TV HD CONTROL VOZ',800,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783015749/ditcash_premios/xmin1ti0ekf3h98b2tyr.png','ditcash_premios/xmin1ti0ekf3h98b2tyr',1,1,0,'2026-07-02 18:09:10.810'),(24,'FREIDORA DE AIRE INNOVA 4 LTS','',210,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783017885/ditcash_premios/mzpqcat5gqoyj60vaxox.png','ditcash_premios/mzpqcat5gqoyj60vaxox',1,1,0,'2026-07-02 18:44:46.819'),(25,'LAVADORA INNOVA DOBLE TANQUE 15KG SEMI-AUTOMATICA','',720,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783017975/ditcash_premios/sqqhhb1aovolac9bpwwb.png','ditcash_premios/sqqhhb1aovolac9bpwwb',1,1,0,'2026-07-02 18:46:16.578'),(26,'REFRIGERADORA HISENSE 250 LTS','',1090,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783018259/ditcash_premios/hx8sozpeeeyy5o362f86.png','ditcash_premios/hx8sozpeeeyy5o362f86',1,1,0,'2026-07-02 18:51:00.189'),(27,'CAFETERA MR CHEF COFEE MAKER 12 TAZAS','',60,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783018629/ditcash_premios/xawntemolg53tihspwz7.png','ditcash_premios/xawntemolg53tihspwz7',1,1,0,'2026-07-02 18:57:10.645'),(28,'CORTADORA DE VERDURAS EBASIX MULTIFUNCIONAL','',20,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783018665/ditcash_premios/aqily1kfxnqjtj9yzurc.jpg','ditcash_premios/aqily1kfxnqjtj9yzurc',1,1,0,'2026-07-02 18:57:46.031'),(29,'CHOMPA DITEC','',20,'https://res.cloudinary.com/dlvmo3axh/image/upload/v1783018807/ditcash_premios/segedsswppqiikcrk0rc.jpg','ditcash_premios/segedsswppqiikcrk0rc',1,1,0,'2026-07-02 19:00:08.748');
/*!40000 ALTER TABLE `Premio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asignaciones_vehiculos`
--

DROP TABLE IF EXISTS `asignaciones_vehiculos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asignaciones_vehiculos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `vehiculoId` int NOT NULL,
  `kmEntrega` double NOT NULL,
  `kmRecepcion` double DEFAULT NULL,
  `fechaInicio` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `fechaFin` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `asignaciones_vehiculos_userId_fkey` (`userId`),
  KEY `asignaciones_vehiculos_vehiculoId_fkey` (`vehiculoId`),
  CONSTRAINT `asignaciones_vehiculos_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `asignaciones_vehiculos_vehiculoId_fkey` FOREIGN KEY (`vehiculoId`) REFERENCES `vehiculos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asignaciones_vehiculos`
--

LOCK TABLES `asignaciones_vehiculos` WRITE;
/*!40000 ALTER TABLE `asignaciones_vehiculos` DISABLE KEYS */;
/*!40000 ALTER TABLE `asignaciones_vehiculos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `campanas`
--

DROP TABLE IF EXISTS `campanas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campanas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `fechaInicio` datetime(3) NOT NULL,
  `fechaFin` datetime(3) NOT NULL,
  `activa` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `urlImagen` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valor` double NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `campanas`
--

LOCK TABLES `campanas` WRITE;
/*!40000 ALTER TABLE `campanas` DISABLE KEYS */;
INSERT INTO `campanas` VALUES (1,'Campaña de AGROFORESTAL','Estimado equipo de ventas, activamos una campaña especial. Por cada unidad que vendan de estos 3 productos seleccionados, ganan $50 Ditcash canjeables por productos Ditec:\r\n\r\n🪓 Motosierra CS 680-70 (24 Unidades)\r\n🎒 Fumigadora Lamborghini Mochila 20Lts (L3200SPS2) (18 Unidades)\r\n🌱 Podadora Ducati 5 en 1 (DBC3300M) (5 Unidades)\r\n\r\n⚠️ ¡Sin límite de ventas! Mientras más vendan, más acumulan.\r\n¡Aprovechen el stock y contacten a sus clientes hoy mismo! 📈🔥','2026-06-01 00:00:00.000','2026-07-31 00:00:00.000',1,'2026-07-01 22:03:01.585','',50),(2,'Campaña de Mural DITEC','Entrega de calendarios. Recuerden: no es solo entregar, es posicionar a DITEC todo el año.\r\n📍 Puntos clave:\r\n- .Lugar estratégico: Búscalo donde todos lo vean.\r\n- Instalación perfecta: Bien pegado y recto (nuestra imagen cuenta).\r\n- Foto obligatoria: Calendario en la pared + profesor + App Timestamp.\r\n¡Vean el video y aseguren sus $1,50 DitCASH por cada instalación impecable! 🏁','2026-06-01 00:00:00.000','2026-07-31 00:00:00.000',1,'2026-07-01 22:07:18.487','',1.5),(3,'Campaña del día del padre \"lo que nunca le dije a papá\"','LO QUE NUNCA LE DIJE A PAPÁ (Campaña activa hasta el 30 de junio)\n\n💰 Ganas 100 DitCASH al video más emotivo y viral.\n📊 Ganas 100 DitCASH si eres el asesor que más videos envíe.\n🎁 Premiazo para tu cliente: Participa por una Camiseta de la TRI 🇪🇨 + Balón + Edredón.','2026-06-01 00:00:00.000','2026-06-30 00:00:00.000',0,'2026-07-02 16:58:37.256','',100);
/*!40000 ALTER TABLE `campanas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes_web`
--

DROP TABLE IF EXISTS `clientes_web`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes_web` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cedula` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `clientes_web_cedula_key` (`cedula`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes_web`
--

LOCK TABLES `clientes_web` WRITE;
/*!40000 ALTER TABLE `clientes_web` DISABLE KEYS */;
INSERT INTO `clientes_web` VALUES (1,'2100158159','$2b$10$uumOcpPTZHZMru7JJoe4Q.MiT.UVdPeAr1hIAal6uKfj.w/K3VmA.','PALLO RUIZ CRISTIAN DANNY',1,'2026-07-01 22:00:18.970','2026-07-01 22:00:18.970');
/*!40000 ALTER TABLE `clientes_web` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gasolineras`
--

DROP TABLE IF EXISTS `gasolineras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gasolineras` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ciudad` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tieneConvenio` tinyint(1) NOT NULL DEFAULT '0',
  `montoRecarga` double NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gasolineras`
--

LOCK TABLES `gasolineras` WRITE;
/*!40000 ALTER TABLE `gasolineras` DISABLE KEYS */;
/*!40000 ALTER TABLE `gasolineras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_advertisements`
--

DROP TABLE IF EXISTS `product_advertisements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_advertisements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_path` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `end_date` datetime(3) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_advertisements_product_code_key` (`product_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_advertisements`
--

LOCK TABLES `product_advertisements` WRITE;
/*!40000 ALTER TABLE `product_advertisements` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_advertisements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registros_combustible`
--

DROP TABLE IF EXISTS `registros_combustible`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registros_combustible` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `vehiculoId` int NOT NULL,
  `gasolineraId` int NOT NULL,
  `kmRecorridos` double NOT NULL,
  `precioTotal` double NOT NULL,
  `galones` double NOT NULL,
  `numFactura` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fueraDeConvenio` tinyint(1) NOT NULL DEFAULT '0',
  `metodoPago` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CONVENIO',
  `fechaFactura` datetime(3) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `registros_combustible_numFactura_key` (`numFactura`),
  KEY `registros_combustible_userId_fkey` (`userId`),
  KEY `registros_combustible_vehiculoId_fkey` (`vehiculoId`),
  KEY `registros_combustible_gasolineraId_fkey` (`gasolineraId`),
  CONSTRAINT `registros_combustible_gasolineraId_fkey` FOREIGN KEY (`gasolineraId`) REFERENCES `gasolineras` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `registros_combustible_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `registros_combustible_vehiculoId_fkey` FOREIGN KEY (`vehiculoId`) REFERENCES `vehiculos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registros_combustible`
--

LOCK TABLES `registros_combustible` WRITE;
/*!40000 ALTER TABLE `registros_combustible` DISABLE KEYS */;
/*!40000 ALTER TABLE `registros_combustible` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registros_rutas_diarias`
--

DROP TABLE IF EXISTS `registros_rutas_diarias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registros_rutas_diarias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `placaCarro` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kmRecorridos` double NOT NULL,
  `procesado` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `registros_rutas_diarias_userId_fkey` (`userId`),
  CONSTRAINT `registros_rutas_diarias_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registros_rutas_diarias`
--

LOCK TABLES `registros_rutas_diarias` WRITE;
/*!40000 ALTER TABLE `registros_rutas_diarias` DISABLE KEYS */;
/*!40000 ALTER TABLE `registros_rutas_diarias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cedula` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rol` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VENDEDOR',
  `estado` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuarios_username_key` (`username`),
  UNIQUE KEY `usuarios_cedula_key` (`cedula`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'1755221270','1755221270','$2a$10$76X6.RclvXmU4Dskv4m6uON2jPZ/VByfKByE6C0KjZ91IuGvN4b2.','Administrador Daya','ADMIN','Activo',1,'2026-07-01 21:22:23.000','2026-07-01 21:22:23.000'),(2,'1500857725','1500857725','$2b$10$gO6knOnMK.PxTVxB1c6PTO8mJLHlgEicDVtLGvkEf2nH0fFbqnLca','VANESSA ANDI','VENDEDOR','Activo',1,'2026-07-01 21:50:52.827','2026-07-01 21:50:52.827'),(3,'1726158791','1726158791','$2b$10$cdY6KsH3nRR5FCZ2n3NNrOCvjAKdNhm9VgkhkjXn7CbY82RrAYICe','BENALCAZAR JAIRO','VENDEDOR','Activo',1,'2026-07-01 21:51:40.069','2026-07-01 21:51:40.069'),(4,'1760738474','1760738474','$2b$10$hfenHGSES.YjWC1AI9YRc.uHkX7HYyG9GS2hm0XoA5atIPfGWtjgm','GIMENEZ MANUEL','VENDEDOR','Activo',1,'2026-07-01 21:52:03.081','2026-07-01 21:52:03.081'),(5,'1450804743','1450804743','$2b$10$dEOKyMvdnsIUmsEEUdkz9eP3MMxnvte0OTyj0eYxoz4JdB9LbHNLi','GUDIÑO JOSE','VENDEDOR','Activo',1,'2026-07-01 21:52:40.168','2026-07-01 21:52:40.168'),(6,'1726952904','1726952904','$2b$10$TNyYfvZ187yQ35PbB.gL7ejqX5WXaRLJTqgTQBvHsHoLgOG/yX04q','VASQUEZ PABLO','VENDEDOR','Activo',1,'2026-07-01 21:53:02.237','2026-07-01 21:53:02.237'),(7,'1756815609','1756815609','$2b$10$amnxDFgEpOH2s7BnvhhbjOGPSH6YBsdawphbhJLqrrxvNVEQRkYSi','VALVERDE ANDERSON','VENDEDOR','Activo',1,'2026-07-01 21:53:21.676','2026-07-01 21:53:21.676'),(8,'1750954529','1750954529','$2b$10$qPCehA5N5c18d.BbIeWRvuTP1X3Z57CteurhyI0XKZ5GLuC2qcuTC','ANDRANGO JOSE','VENDEDOR','Activo',1,'2026-07-01 21:53:41.362','2026-07-01 21:53:41.362'),(9,'1400971733','1400971733','$2b$10$xZ53zSVbK4JG3x0uB6H9JO35Cwa7gfB/o69KIwK0lVaQbptBbDmq.','DIANA CAJILIMA','VENDEDOR','Activo',1,'2026-07-01 21:54:05.309','2026-07-01 21:54:05.309'),(10,'0805399631','0805399631','$2b$10$DmS7U.jL8jx3OqyMx5vMYuPE7a71AVwJNT9wPNrzzFz4g3Bg8n62y','KENNETH VALENCIA','VENDEDOR','Activo',1,'2026-07-01 21:54:36.392','2026-07-01 21:54:36.392'),(11,'1401319247','1401319247','$2b$10$E0KRGyi7eoqgcEnxQjAQIeqt/9Xd7K/f2/puQKoHoBR/ozlXM.IPa','MARCOS JINTIA','VENDEDOR','Activo',1,'2026-07-01 21:54:49.499','2026-07-01 21:54:49.499'),(12,'0105106249','0105106249','$2b$10$nWmNN.Ck6rqabIgqYYcjo.0qaMp8tL838nbNHUG6j3Ofb4cjKRIPi','ANTONHY PINTADO','VENDEDOR','Activo',1,'2026-07-01 21:55:08.422','2026-07-01 21:55:08.422'),(13,'1715119622','1715119622','$2b$10$g8DOEzoRPDmleuwwfNN7xeumfb8HRRKp1Uiq3i8MlDTEUpX3UFFLS','marco yaguana','MARKETING','Activo',1,'2026-07-01 21:55:42.263','2026-07-01 21:55:42.263'),(14,'1713885091','1713885091','$2b$10$wMoxhNKY0mhH69a0PJje9.MXnWkTwnzp9WYMReZ7dosqa6G/rIdRC','WILSON ARAUJO','ADMIN','Activo',1,'2026-07-02 15:19:18.397','2026-07-02 15:19:18.397'),(15,'2100158159','2100158159','$2b$10$h/5cCOHXlTVMvbQ0C7tbOeQydmVpNhh4KzdvudoUwVJ6dsDJibv3O','CRISTIAN PALLO','VENDEDOR','Activo',1,'2026-07-02 16:18:13.881','2026-07-02 16:18:13.881');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehiculos`
--

DROP TABLE IF EXISTS `vehiculos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehiculos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `placa` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `marcaModelo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kmActual` double NOT NULL DEFAULT '0',
  `kmUltimoAceite` double NOT NULL DEFAULT '0',
  `intervaloAlerta` double NOT NULL DEFAULT '5000',
  `alertaMantenimiento` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vehiculos_placa_key` (`placa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehiculos`
--

LOCK TABLES `vehiculos` WRITE;
/*!40000 ALTER TABLE `vehiculos` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehiculos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendedores`
--

DROP TABLE IF EXISTS `vendedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendedores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cedula` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `puntosAcumulados` decimal(10,2) NOT NULL DEFAULT '0.00',
  `saldoGastado` decimal(10,2) NOT NULL DEFAULT '0.00',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `usuarioId` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vendedores_cedula_key` (`cedula`),
  UNIQUE KEY `vendedores_usuarioId_key` (`usuarioId`),
  CONSTRAINT `vendedores_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendedores`
--

LOCK TABLES `vendedores` WRITE;
/*!40000 ALTER TABLE `vendedores` DISABLE KEYS */;
INSERT INTO `vendedores` VALUES (1,'1500857725','VANESSA ANDI',NULL,239.50,0.00,1,2,'2026-07-01 21:50:52.835','2026-07-15 13:41:07.235'),(2,'1726158791','BENALCAZAR JAIRO',NULL,212.00,60.00,1,3,'2026-07-01 21:51:40.072','2026-07-02 15:54:18.547'),(3,'1760738474','GIMENEZ MANUEL',NULL,55.50,0.00,1,4,'2026-07-01 21:52:03.084','2026-07-01 21:52:03.084'),(4,'1450804743','GUDIÑO JOSE',NULL,7.50,0.00,1,5,'2026-07-01 21:52:40.170','2026-07-01 21:52:40.170'),(5,'1726952904','VASQUEZ PABLO',NULL,4.50,0.00,1,6,'2026-07-01 21:53:02.240','2026-07-01 21:53:02.240'),(6,'1756815609','VALVERDE ANDERSON',NULL,263.50,0.00,1,7,'2026-07-01 21:53:21.679','2026-07-13 17:28:51.037'),(7,'1750954529','ANDRANGO JOSE',NULL,24.00,0.00,1,8,'2026-07-01 21:53:41.364','2026-07-01 21:53:41.364'),(8,'1400971733','DIANA CAJILIMA',NULL,1.50,0.00,1,9,'2026-07-01 21:54:05.312','2026-07-01 21:54:05.312'),(9,'0805399631','KENNETH VALENCIA',NULL,36.00,0.00,1,10,'2026-07-01 21:54:36.394','2026-07-01 21:54:36.394'),(10,'1401319247','MARCOS JINTIA',NULL,49.00,0.00,1,11,'2026-07-01 21:54:49.501','2026-07-01 21:54:49.501'),(11,'0105106249','ANTONHY PINTADO',NULL,96.50,0.00,1,12,'2026-07-01 21:55:08.423','2026-07-08 19:36:30.538'),(12,'2100158159','CRISTIAN PALLO',NULL,127.50,30.00,1,15,'2026-07-02 16:18:13.885','2026-07-15 13:41:20.078');
/*!40000 ALTER TABLE `vendedores` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-21 15:32:00
