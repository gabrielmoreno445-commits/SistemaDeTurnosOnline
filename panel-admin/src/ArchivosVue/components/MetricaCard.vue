<!--
MetricaCard.vue
Card reutilizable para mostrar una metrica individual.
Recibe un titulo, un valor y un color opcional para el valor.
La usan DashboardPage y MetricasPage para mantener consistencia visual.
-->
<script setup>
const props = defineProps({
  titulo: {
    type: String,
    required: true
  },
  valor: {
    type: [String, Number],
    required: true
  },
  detalle: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: 'var(--color-primary)'
  }
});
</script>

<template>
  <article class="metrica-card">
    <p class="metrica-card__titulo">{{ props.titulo }}</p>
    <p class="metrica-card__valor" :style="{ color: props.color }">
      {{ props.valor }}
    </p>
    <p v-if="props.detalle" class="metrica-card__detalle">
      {{ props.detalle }}
    </p>
  </article>
</template>

<style scoped>
.metrica-card {
  display: grid;
  gap: 10px;
  padding: 18px;
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: var(--radius-lg, 1rem);
  background: var(--color-surface-elevated, #ffffff);
  box-shadow: var(--shadow-sm, 0 10px 30px rgba(15, 23, 42, 0.08));
}

.metrica-card__titulo,
.metrica-card__valor,
.metrica-card__detalle {
  margin: 0;
}

.metrica-card__titulo {
  color: var(--color-text-muted, #64748b);
  font-size: var(--font-size-sm, 0.95rem);
  font-weight: 600;
}

.metrica-card__valor {
  font-size: 1.9rem;
  font-weight: 800;
  line-height: 1.1;
}

.metrica-card__detalle {
  color: var(--color-text-muted, #64748b);
  font-size: 0.9rem;
  line-height: 1.4;
}
</style>
