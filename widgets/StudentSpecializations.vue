<template>
    <div class="student-study-program-container offset-bottom-large">
        <div class="form-group">
            <label>{{ placeholder }}</label>
            <custom-select :options="available"
                           :selected-by-default="current.study_program_id"
                           :placeholder="placeholder"
                           @change="changeProgram($event)"
                           with-search="true"
                           value-key="name"
                           id-key="id"
            />
        </div>
        <div class="columns two-columns">
            <div class="column">
                <div class="form-group">
                    <label>{{ priceLabel }}</label>
                    <input type="text" class="input-component" :value="current.price" disabled />
                </div>
            </div>
            <div class="column">
                <div class="form-group">
                    <label>{{ yearLabel }}</label>
                    <custom-select :options="years"
                                   id-key="year"
                                   value-key="year"
                                   :selected-by-default="year"
                                   :placeholder="'Start Year'"
                                   v-on:change="changeYear($event)"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import bus from './../bus'

export default {
    name: "StudentSpecializations",
    props: [
        'specializations',
        'options',
        'placeholder',
        'years',
        'addLabel',
        'yearLabel',
        'priceLabel',
        'name'
    ],
    data() {
        return {
            current: {  },
            available: [],
            year: (new Date()).getFullYear()
        };
    },
    mounted() {
        if (typeof this.specializations !== "undefined" && this.specializations.length > 0) {
            const current = JSON.parse(this.specializations);
            this.current = {
                study_program_id: current.id,
                year: current.pivot.year,
                price: current.pivot.price
            };
        } else {
            this.current = {
                study_program_id: null,
                year: this.year,
                price: 0
            };
        }

        this.available = JSON.parse(this.options);

        bus.$on('student::study-program::update', (program) => this.updateProgram(program));
        bus.$on('student::study-program::change-year', (year) => this.updateYear(year));
        bus.$on('student::update-price', ({id, price}) => this.updatePrice(id, price));
    },
    methods:{
        updatePrice(id, price) {
            if (id === this.current.study_program_id) {
                this.current.price = price / 100;
            }
        },
        updateYear(year) {
            this.year = year;
        },
        updateProgram(sp) {
            let id = null;

            if (sp !== null) {
                id = sp.id;
            }

            const program = {
                study_program_id: id,
                year: this.year,
                price: 0
            };
            this.$set(this, 'current', program);
        },
        changeProgram(id) {
            const program = this.available.find(p => p.id === id);
            this.updateProgram(program);

            bus.$emit('student::study-program::compact::change', {
                id, year: this.year
            });
        },
        changeYear(year) {
            bus.$emit('student::study-program::compact::change-year', year);

            this.updateYear(year);
        }
    }
}
</script>

<style scoped>

</style>
