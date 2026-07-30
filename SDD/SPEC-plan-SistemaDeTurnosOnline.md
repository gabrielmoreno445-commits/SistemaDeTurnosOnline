# SPEC PLAN - SistemaDeTurnosOnline

> Proyecto: Sistema de turnos online para profesionales independientes
> Tipo: Plan de trabajo
> Estado: Vigente

## 1. Objetivo del plan

Ordenar el trabajo de mantenimiento y cierre para que el proyecto se presente como una demo academica estable, coherente y facil de ejecutar.

## 2. Estado actual

- El sitio publico esta funcional.
- El panel admin esta funcional.
- El backend responde correctamente con Docker.
- La demo local funciona sin Docker.
- La documentacion principal ya fue alineada con el producto real.
- El repositorio ya no depende de artefactos temporales para explicar su uso.

## 3. Prioridades del producto

1. Mantener estable el flujo actual.
2. Mantener la documentacion sincronizada con el codigo.
3. Evitar regresiones en panel, sitio publico y backend.
4. Sostener la demo sin infraestructura externa.
5. Preparar una presentacion final clara para evaluacion academica.

## 4. Lineas de trabajo

### 4.1 Consolidacion

- Revisar que la demo local siga funcionando.
- Verificar que el panel admin no dependa de Docker para pruebas.
- Validar que el sitio publico conserve el flujo de busqueda y reserva.
- Confirmar que los servicios del backend sigan respondiendo sin errores visibles.

### 4.2 Documentacion

- Mantener este SDD actualizado.
- Separar claramente alcance funcional, tecnico y plan.
- Reflejar el enfoque real del proyecto:
  - atencion a domicilio
  - atencion en local
  - cobertura geografica acotada
  - demo local con datos simulados

### 4.3 UI / UX

- Mantener la visual estable actual.
- Mejorar jerarquia visual solo si no rompe funcionalidad.
- Evitar que el modo demo y el modo real se perciban como aplicaciones distintas.

### 4.4 Produccion y entrega

- Confirmar variables de entorno de desarrollo y produccion.
- Validar deploy del panel admin.
- Validar deploy del sitio publico.
- Revisar rutas y dominios finales.
- Mantener el backend con mensajes de error claros y sin fallas silenciosas.

## 5. Entregables esperados

- SPEC funcional completo.
- SPEC tecnico completo.
- SPEC plan completo.
- Aplicacion estable en modo local.
- Demo util para mostrar el proyecto sin infraestructura pesada.
- Repo limpio y apto para publicarse.

## 6. Tareas de mantenimiento sugeridas

- Revisar el visual del panel admin si aparece alguna regresion.
- Unificar estilo entre publico y admin cuando haga falta.
- Confirmar URLs finales de prueba.
- Documentar credenciales demo.
- Validar que no haya archivos temporales versionados.

## 7. Criterios de cierre

Se considera que el plan esta cumplido cuando:

- el producto funciona localmente,
- la demo esta disponible,
- la documentacion no se contradice,
- el repositorio esta limpio,
- y la experiencia del proyecto puede mostrarse sin explicaciones largas.

