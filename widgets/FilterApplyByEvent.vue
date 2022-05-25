<template>
    <form method="get" ref="form">
        <input type="hidden" v-bind:name="fieldName" v-bind:value="value" />
    </form>
</template>

<script>
import bus from '../bus'

export default {
    name: "FilterApplyByEvent",
    props: [ 'event', 'name' ],
    data() {
        return {
            value: null
        }
    },
    computed: {
        fieldName() {
            return `filters[${this.name}]`;
        }
    },
    mounted() {
        bus.$on(this.event, (value) => {
            this.value = value;
            this.$nextTick(() => {
                this.$refs.form.submit();
            });
        });
    }
}
</script>

<style scoped>

</style>
