<template>
    <div>
        <div class="headline">
            <h1 class="headline-text">Спеціалізації</h1>
            <a href="javascript:" class="button button-large button-accent" @click.prevent="saveInstruments()">
                <span>Зберегти</span>
            </a>
        </div>

        <form method="post" v-bind:action="saveUrl" class="card card-table offset-top-large offset-bottom-large form" ref="form">
            <input type="hidden" name="_token" v-bind:value="csrf">
            <div class="card-body">
                <table class="table instruments-table">
                    <thead>
                    <tr>
                        <th class="checkbox-column">&nbsp;</th>
                        <th class="instruments-table-name-column">Название</th>
                        <th class="instruments-table-price-column" colspan="2">Цена</th>
                    </tr>
                    <tr>
                        <th class="id-column"></th>
                        <th class="instruments-table-name-column">
                            <input type="text" class="input-component" v-model="filter" />
                        </th>
                        <th class="instruments-table-price-column" colspan="2"></th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="instrument in allInstruments"
                        v-if="filter === null || instrument.name.toLowerCase().indexOf(filter.toLowerCase()) > -1"
                        class="row-with-action">
                        <td class="checkbox-column">
                            <div class="form-group form-group-checkbox">
                                <label>
                                    <input type="checkbox" v-model="instrument.attached" />
                                    <div class="checkbox-placeholder"></div>
                                </label>
                            </div>
                        </td>
                        <td class="instruments-table-name-column">{{ instrument.name }}</td>
                        <td class="instruments-table-recommended-price-column">
                            <span v-if="!isPricesAreSame(instrument)">Рекомендована ціна: {{ getRecommendedPrice(instrument) }} грн</span>
                        </td>
                        <td class="instruments-table-price-column" @click.prevent>
                            <custom-number-input v-bind:value="instrument.price || 0"
                                                 v-bind:name="`instruments[${instrument.id}]`"
                                                 v-bind:min="0"
                                                 v-if="instrument.attached"
                                                 @change="updatePrice($event, instrument)"
                            />
                            <div class="input-placeholder" v-if="!instrument.attached"></div>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </form>

        <div class="headline">
            <h1 class="headline-text">Спеціалізації</h1>
            <a href="javascript:" class="button button-large button-accent" @click.prevent="saveInstruments()">
                <span>Зберегти</span>
            </a>
        </div>
    </div>
</template>

<script>
export default {
    name: "AssignInstruments",
    props: [ 'instruments', 'saveUrl', 'csrf' ],
    data() {
        return {
            allInstruments: [],
            filter: null
        };
    },
    mounted() {
        if (typeof this.instruments !== "undefined") {
            this.allInstruments = JSON.parse(this.instruments);
        }
    },
    methods: {
        __(stringId) {
            return stringId;
        },
        saveInstruments() {
            this.$refs.form.submit();
        },
        toggleAttached(instrument) {
            instrument.attached = !instrument.attached;
        },
        getRecommendedPrice(instrument) {
            return (instrument.recommended_price / 100).toFixed(2);
        },
        isPricesAreSame(instrument) {
            return instrument.recommended_price / 100 === Number(instrument.price);
        },
        updatePrice(value, instrument) {
            instrument.price = value;
        }
    }
}
</script>

<style scoped>

</style>
