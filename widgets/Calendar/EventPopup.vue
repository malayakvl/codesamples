<template>
    <popup is-form="false"
           title="Заняття"
           v-bind:visible="showPopup"
           v-bind:is-locked="lockPopup"
           v-bind:is-apply-locked="!isTimeAvailable"
           id="test"
           v-bind:modal="isPopupModal"
           managed="true"
           v-if="currentEvent !== null && isEditable"
           @close="discardEvent()"
           @apply="applyEvent()"
    >
        <div class="alert alert-danger alert-messages-list offset-bottom-large" v-if="errors.length > 0 || !isTimeAvailable">
            <ul>
                <li class="message" v-for="error in errors">{{ error }}</li>
                <li class="message" v-if="!isTimeAvailable">Вибраний час недоступний</li>
            </ul>
        </div>

        <div class="form-group">
            <label>Тривалість заняття</label>
            <custom-number-input v-bind:value="currentEvent.duration" v-bind:max="maxTimeLeft" native-step="0.1" step="15" min="0" @change="updateDuration($event)" />
        </div>

        <div class="form-group form-group-checkbox offset-bottom-medium" v-if="currentEvent.eventType !== 'one-time'">
            <label>
                <input type="checkbox" name="onetime" value="1" v-bind:checked="currentEvent.onetime" @change="toggleOnetime()" />
                <div class="checkbox-placeholder"></div>
                <span class="label-value">Одноразове заняття</span>
            </label>
        </div>

        <div class="columns two-columns small-gap">
            <div class="form-group">
                <label>Час початку</label>
                <custom-number-input v-bind:value="currentEvent.hour + Number(currentWorkSchedule.from)"
                                     v-bind:min="Number(currentWorkSchedule.from)"
                                     v-bind:max="Number(currentWorkSchedule.until)" step="1" @change="updateHour($event)" />
            </div>
            <div class="form-group">
                <label>Хвилина початку</label>
                <custom-number-input v-bind:value="currentEvent.minute" step="1" @change="updateMinute($event)" min="0" max="59" />
            </div>
        </div>

        <div class="form-group" v-if="currentEvent.eventType !== 'one-time'">
            <label>Викладач</label>
            <custom-select name="teacher_id"
                           value-key="full_name"
                           id-key="id"
                           placeholder="Викладач"
                           with-search="true"
                           v-bind:options="teachers"
                           v-bind:selected-by-default="currentEvent.teacher_id"
                           @change="updateTeacher($event)"
            />
        </div>
    </popup>
</template>

<script>
import bus from '../bus'
import lodash from 'lodash'
const CELL_WIDTH = 55;
const MINUTE_WIDTH = CELL_WIDTH / 15;
</script>
