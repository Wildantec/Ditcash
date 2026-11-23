-- CreateTable
CREATE TABLE `MesServicioTecnico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mesAnio` VARCHAR(191) NOT NULL,
    `presupuesto` DOUBLE NOT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'ABIERTO',
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MesServicioTecnico_mesAnio_key`(`mesAnio`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReparacionServicioTecnico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `cliente` VARCHAR(191) NOT NULL,
    `equipoId` INTEGER NOT NULL,
    `descripcion` TEXT NULL,
    `comprobante` VARCHAR(191) NULL,
    `valorGastado` DOUBLE NOT NULL,
    `valorRecuperado` DOUBLE NOT NULL DEFAULT 0,
    `resultadoNeto` DOUBLE NOT NULL,
    `estadoRentabilidad` VARCHAR(191) NOT NULL,
    `mesId` INTEGER NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EquipoServicioTecnico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `habilitado` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `EquipoServicioTecnico_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ReparacionServicioTecnico` ADD CONSTRAINT `ReparacionServicioTecnico_equipoId_fkey` FOREIGN KEY (`equipoId`) REFERENCES `EquipoServicioTecnico`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReparacionServicioTecnico` ADD CONSTRAINT `ReparacionServicioTecnico_mesId_fkey` FOREIGN KEY (`mesId`) REFERENCES `MesServicioTecnico`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
