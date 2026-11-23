-- Actualización limitada a control de aceite y contratos pendientes de sumar.
-- Los registros históricos quedan sin clasificar; no se supone que cambiaron aceite.
ALTER TABLE `kardex_vehiculos`
  ADD COLUMN `esCambioAceite` BOOLEAN NULL,
  ADD COLUMN `kilometrajeServicio` DOUBLE NULL;

ALTER TABLE `evaluaciones_vendedores`
  ADD COLUMN `revision` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `calificacionCierre` VARCHAR(191) NULL;

CREATE TABLE `pendientes_facturacion` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `evaluacionId` INTEGER NOT NULL,
  `cantidad` INTEGER NOT NULL,
  `valor` DECIMAL(14, 2) NOT NULL,
  `motivo` VARCHAR(200) NOT NULL,
  `referencia` VARCHAR(500) NULL,
  `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `creadoPor` VARCHAR(191) NOT NULL,
  `regularizadoEn` DATETIME(3) NULL,
  `regularizadoPor` VARCHAR(191) NULL,
  PRIMARY KEY (`id`),
  INDEX `pendientes_facturacion_evaluacionId_regularizadoEn_idx` (`evaluacionId`, `regularizadoEn`),
  CONSTRAINT `pendientes_facturacion_evaluacionId_fkey` FOREIGN KEY (`evaluacionId`)
    REFERENCES `evaluaciones_vendedores` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
