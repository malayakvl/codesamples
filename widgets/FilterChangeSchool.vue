<template>
<form method="get" ref="form">
    <input type="hidden" name="filters[school]" v-bind:value="schoolId" />
</form>
</template>

<script>
import bus from './../bus'

export default {
    name: "FilterChangeSchool",
    props: [ 'event' ],
    data() {
        return {
            schoolId: null
        };
    },
    mounted() {
        bus.$on(this.event, (schoolId) => {
            this.schoolId = schoolId;
            this.$nextTick(() => {
                this.$refs.form.submit();
            });
        });
    }
}
</script>

<style scoped>

</style>
