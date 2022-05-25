<template>
    <div class="range-container input-select range-select">
        <div class="range-select" @click="toggleCalendar()">
            <div class="input-value">{{ start }} - {{ end }}</div>
            <div class="icon-container">
                <img svg-inline src="./../../svg/dropdown-icon.svg" class="custom-select-item" />
            </div>
        </div>
        <calendar-popup v-bind:select-range="true"
                        v-bind:close-automatically="true"
                        v-bind:value="new Date()"
                        v-bind:select-week="false"
                        v-bind:rangeStart="start"
                        v-bind:rangeEnd="end"
                        v-if="showCalendar"
                        @changeRange="updateRange($event)"
                        @close="toggleCalendar()"
        ></calendar-popup>
    </div>
</template>

<script>
export default {
    name: "AccountantRangeSelect",
    props: [ 'financesUrl', 'start', 'end' ],
    data() {
        return {
            showCalendar: false
        }
    },
    methods: {
        updateRange({start, end}) {
            let startDate = start.getDate();
            let startMonth = start.getMonth() + 1;
            const startYear = start.getFullYear();

            let endDate = end.getDate();
            let endMonth = end.getMonth() + 1;
            const endYear = end.getFullYear();

            startDate = `00${startDate}`.substr(-2);
            startMonth = `00${startMonth}`.substr(-2);

            endDate = `00${endDate}`.substr(-2);
            endMonth = `00${endMonth}`.substr(-2);

            const startFormatted = `${startDate}.${startMonth}.${startYear}`;
            const endFormatted = `${endDate}.${endMonth}.${endYear}`;

            location.href = `${this.financesUrl}?start=${startFormatted}&end=${endFormatted}`;
        },
        toggleCalendar() {
            this.showCalendar = !this.showCalendar;
        }
    }
}
</script>

<style scoped>

</style>
