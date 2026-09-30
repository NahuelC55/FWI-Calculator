-- Script de inicialización de la Base de Datos MySQL para el Sistema FWI
CREATE DATABASE IF NOT EXISTS `fwi_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Asignar privilegios al usuario root o usuario personalizado
GRANT ALL PRIVILEGES ON `fwi_db`.* TO 'root'@'localhost';
FLUSH PRIVILEGES;

USE `fwi_db`;
