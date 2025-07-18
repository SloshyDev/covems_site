# Funcionalidad de Actualización Masiva de Saldos

## Descripción

Se ha implementado una nueva funcionalidad para actualizar automáticamente los saldos pendientes de todos los agentes y supervisores activos en el sistema.

## Ubicación

La funcionalidad se encuentra en la página de **Ver Estados de Cuenta** (`/view_statements`), accesible desde el menú principal del header.

## Características Implementadas

### 1. Botón de Configuración
- **Ubicación**: Esquina superior derecha de la página de estados de cuenta
- **Texto**: "Actualizar Todos los Saldos"
- **Color**: Purple (morado)

### 2. Modal de Configuración
El modal permite:

#### Opciones de Período:
- **Automático (Recomendado)**: Usa el período más reciente con recibos disponibles
- **Manual**: Permite seleccionar año y mes específicos

#### Información Educativa:
- Explica qué hace la funcionalidad
- Describe las reglas de negocio aplicadas

### 3. Proceso de Actualización

#### Backend (`/api/saldos-pendientes/update-all`)
El endpoint procesa:

1. **Obtención de Usuarios**:
   - Todos los usuarios activos (agentes y supervisores)
   - Filtro por estado "activo"

2. **Determinación del Período**:
   - Automático: Usa el mes más reciente con recibos
   - Manual: Usa año/mes especificados por el usuario

3. **Procesamiento por Usuario**:
   - **Agentes**: Busca recibos por `claveAgente`
   - **Supervisores**: Busca recibos de agentes bajo su supervisión

4. **Cálculo de Comisiones**:
   - **Agentes**: Suma de `comisAgente`
   - **Supervisores**: Suma de `comisSupervisor`

5. **Aplicación de Lógica de Negocio**:
   - Usa el servicio `manejarSaldoPendiente` existente
   - Aplica todas las reglas de negocio establecidas:
     - Crear saldo si comisión es negativa
     - Cerrar saldo previo si tenía saldo pendiente pero ahora es positivo
     - No duplicar registros para la misma fecha

### 4. Interfaz de Usuario

#### Estados de la UI:
- **Normal**: Botón azul "Configurar Actualización"
- **Procesando**: Indicador animado con spinner y mensaje informativo
- **Completado**: Mensaje de éxito con estadísticas detalladas
- **Error**: Mensaje de error descriptivo

#### Resultados Mostrados:
- Total de usuarios procesados
- Saldos creados (negativos)
- Saldos cerrados (valor 0)
- Número de errores encontrados
- Lista detallada de todas las operaciones realizadas

### 5. Seguridad y Validaciones

#### Confirmaciones:
- Modal de confirmación antes de iniciar el proceso
- Advertencia sobre el tiempo que puede tomar

#### Prevención de Errores:
- Deshabilitación de botones durante el proceso
- Manejo de errores robusto
- Transacciones de base de datos seguras

#### Idempotencia:
- No crea registros duplicados
- Verifica saldos existentes antes de crear nuevos

## Reglas de Negocio Aplicadas

### 1. Comisión Negativa
- **Condición**: `comisionTotal < 0`
- **Acción**: Crear saldo pendiente para el siguiente corte
- **Monto**: Valor de la comisión negativa

### 2. Cierre de Saldo Previo
- **Condición**: Usuario tenía saldo pendiente previo Y comisión actual es positiva
- **Acción**: Crear registro de cierre con saldo = 0
- **Observaciones**: Incluye mensaje explicativo del cierre

### 3. Sin Acción Requerida
- **Condición**: Sin saldo previo Y comisión positiva/cero
- **Acción**: Ninguna

## Archivos Modificados/Creados

### Archivos Modificados/Creados:
- `src/app/api/saldos-pendientes/update-all/route.js` - Endpoint backend
- `src/app/view_statements/page.js` - Interfaz de usuario

### Dependencias:
- Utiliza `saldoPendienteService.js` existente
- Integra con el esquema Prisma existente
- Compatible con la lógica de negocio establecida

## Uso

1. **Acceder**: Ir a la página de "Ver Estados de Cuenta"
2. **Configurar**: Hacer clic en "Actualizar Todos los Saldos" (esquina superior derecha)
3. **Seleccionar**: Elegir período (automático recomendado)
4. **Confirmar**: Hacer clic en "Iniciar Actualización"
5. **Esperar**: El proceso puede tomar varios minutos
6. **Revisar**: Ver los resultados detallados al completarse

## Notas Técnicas

- **Performance**: Optimizado para procesar grandes volúmenes de datos
- **Logging**: Registro detallado de todas las operaciones
- **Error Handling**: Manejo robusto de errores con continuación del proceso
- **Database**: Usa conexiones Prisma existentes
- **UI/UX**: Diseño consistente con el resto de la aplicación
