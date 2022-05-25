<template>
    <div class="change-school-container" ref="options">
        <div class="change-school-button" @click="toggleOptions()"><img svg-inline src="./../../svg/expand-more-icon.svg" class="icon" /></div>
        <div class="change-school-options" v-if="showOptions">
            <div class="option" v-for="school in allowedSchools" @click="changeSchool(school)">{{ school.name }}</div>
        </div>
    </div>
</template>

<script>
export default {
    name: "AccountantChangeSchool",
    props: [ 'schools', 'url' ],
    data() {
        return {
            allowedSchools: [],
            showOptions: false,
            clickOutside: null
        };
    },
    mounted() {
        if (typeof this.schools !== "undefined") {
            this.allowedSchools = JSON.parse(this.schools);
        }

        this.clickOutside = (e) => this.onClickOutside(e);
        document.addEventListener('click', this.clickOutside);
    },
    beforeDestroy() {
        document.removeEventListener('click', this.clickOutside);
    },
    methods: {
        onClickOutside(e) {
            if (!this.showOptions) {
                return ;
            }

            let target = e.target;
            let isInside = false;
            while (target !== document.body) {
                if (target === this.$refs.options) {
                    isInside = true;
                }

                target = target.parentElement;
            }

            if (!isInside) {
                this.showOptions = false;
            }
        },
        changeSchool(school) {
            location.href = `${this.url}?school_id=${school.id}`;
        },
        toggleOptions() {
            this.showOptions = !this.showOptions;
        }
    }
}
</script>

<style scoped>

</style>
