<template>
    <tr>
        <td class="subject-column" v-bind:class="{'with-floating-icon': isWithRemove}">
            <span>{{ subject.full_name }}</span><!--
            --><template v-if="subject.type === 'individual' && subject.is_with_specialization"><!--
                --><template v-if="!readonly"><span> - </span>
                <a href="javascript:" class="link link-bold"
                   @click.prevent="selectSpecialization()"
                   v-if="selectedSpecialization === null">обрати спеціалізацію</a></template>
                <template v-if="selectedSpecialization !== null">
                    <span>{{ selectedSpecialization.name }}</span><template v-if="!readonly">&nbsp;
                    (<a href="javascript:" class="link link-bold"
                       @click.prevent="selectSpecialization()">змінити</a>)</template>
                </template>
            </template>

            <img svg-inline src="./../../svg/remove-icon.svg"
                 class="icon remove-subject-icon"
                 @click="removeSubject()"
                 v-if="isWithRemove && !readonly"
            />
        </td>
        <td v-for="(year, index) in schedule" class="with-input" v-bind:class="{'highlight-current': studyYear === index + 1}">
            <div class="text-center" v-if="!isEditable || readonly">{{ year.pivot.hours }}</div>
            <input type="number"
                   class="text-center"
                   step="0.01"
                   v-bind:value="year.pivot.hours"
                   v-bind:name="`${namePrefix}[${subject.id}][years][]`"
                   v-if="isEditable && !readonly"
                   @change="updateHour($event, year, index)"
            />
        </td>
        <td class="action-column with-select" v-bind:class="{'lock-loading': lockGroups}">
            <div class="flex flex-center" v-if="subject.type === 'group'" v-bind:class="{'with-button-after': isGroupAttached(subject.group_id)}">
                <custom-select placeholder="Група"
                               id-key="id"
                               value-key="name_with_count"
                               data-prefix="data"
                               v-bind:options="groups || []"
                               v-bind:selected-by-default="subject.group_id"
                               v-bind:name="`${namePrefix}[${subject.id}][group_id]`"
                               v-bind:readonly="readonly"
                               v-bind:groups="'auto'"
                               v-if="subject.type === 'group'"
                               @change="updateGroup($event)"
                ></custom-select>
                <a class="open-group-link" target="_blank"
                   v-bind:href="`/groups/${subject.group_id}/edit`"
                   v-if="isGroupAttached(subject.group_id) && !withoutLinks">
                    <img svg-inline src="./../../svg/open-icon.svg" class="icon" />
                </a>
            </div>
            <div class="flex flex-center" v-if="subject.type === 'individual'" v-bind:class="{'with-button-after': isTeacherAttached(subject.teacher_id)}">
                <custom-select placeholder="Вчитель"
                               id-key="id"
                               value-key="full_name"
                               v-bind:options="teachers || []"
                               v-bind:name="`${namePrefix}[${subject.id}][teacher_id]`"
                               v-bind:selected-by-default="subject.teacher_id"
                               v-bind:readonly="readonly"
                               @change="updateTeacher($event)"
                ></custom-select>
                <a class="open-group-link" target="_blank"
                   v-bind:href="`/teachers/${subject.teacher_id}`"
                   v-if="isTeacherAttached(subject.teacher_id) && !withoutLinks">
                    <img svg-inline src="./../../svg/open-icon.svg" class="icon" />
                    <input type="hidden" v-if="selectedSpecialization !== null"
                           v-bind:value="selectedSpecialization.id"
                           v-bind:name="`${namePrefix}[${subject.id}][instrument_id]`" />
                </a>
            </div>
        </td>
        <td class="action-column with-select" v-bind:class="{'lock-loading': lockGroups}">
            <div class="flex flex-center" v-if="subject.type === 'individual'" v-bind:class="{'with-button-after': isTeacherAccompanistAttached(subject.teacher_accompanist_id)}">
                <custom-select placeholder="Концертмейстер"
                               id-key="id"
                               value-key="full_name"
                               v-bind:options="teachersAccompanist || []"
                               v-bind:name="`${namePrefix}[${subject.id}][teacher_accompanist_id]`"
                               v-bind:selected-by-default="subject.teacher_accompanist_id"
                               v-bind:readonly="readonly"
                               @change="updateTeacherAccompanist($event)"
                ></custom-select>
<!--                <a class="open-group-link" target="_blank"-->
<!--                   v-bind:href="`/teachers/${subject.teacher_accompanist_id}`"-->
<!--                   v-if="isTeacherAccompanistAttached(subject.teacher_accompanist_id) && !withoutLinks">-->
<!--                    <img svg-inline src="./../../svg/open-icon.svg" class="icon" />-->
<!--                    <input type="hidden" v-if="selectedSpecialization !== null"-->
<!--                           v-bind:value="selectedSpecialization.id"-->
<!--                           v-bind:name="`${namePrefix}[${subject.id}][instrument_id]`" />-->
<!--                </a>-->
            </div>
        </td>
    </tr>
</template>

<script>
export default {
    name: "StudentStudyProgramSubject",
    props: [
        'subject',
        'schedule',
        'editable',
        'groups',
        'studentId',
        'assignGroupUrl',
        'studyProgramId',
        'namePrefix',
        'specializations',
        'teachers',
        'teachersAccompanist',
        'withRemove',
        'readonly',
        'studyYear',
        'withoutLinks'
    ],
    data() {
        return {
            lockGroups: false
        };
    },
    computed: {
        isEditable() {
            return typeof this.editable !== "undefined" && this.editable;
        },
        isWithRemove() {
            return typeof this.withRemove !== "undefined" && this.withRemove;
        },
        selectedSpecialization() {
            if (typeof this.subject.instrument_id === "undefined" || this.subject.instrument_id === null) {
                return null;
            }

            return this.specializations.find(i => i.id === this.subject.instrument_id);
        }
    },
    methods: {
        updateGroup(groupId) {
            this.subject.group_id = groupId;

            // if (typeof this.studentId === "undefined" || this.studentId === null || this.studentId.length < 1) {
            //     return ;
            // }
            //
            // this.lockGroups = true;
            // axios.post(`${this.assignGroupUrl}`, {
            //     studentId: this.studentId,
            //     subjectId: this.subject.id,
            //     studyProgramId: this.studyProgramId,
            //     groupId
            // })
            //     .then(response => response.data)
            //     .then(() => this.lockGroups = false)
            // ;
        },
        updateTeacher(id) {
            this.$set(this.subject, 'teacher_id', id);
        },
        updateTeacherAccompanist(id) {
            this.$set(this.subject, 'teacher_accompanist_id', id);
        },
        isGroupAttached(groupId) {
            return groupId !== null && typeof groupId !== "undefined";
        },
        isTeacherAttached(teacherId) {
            return teacherId !== null && typeof teacherId !== "undefined";
        },
        isTeacherAccompanistAttached(teacherId) {
            return teacherId !== null && typeof teacherId !== "undefined";
        },
        selectSpecialization() {
            this.$emit('selectSpecialization');
        },
        removeSubject() {
            this.$emit('removeSubject')
        },
        updateHour(event, year, index) {
            year.pivot.hours = Number(event.target.value);
        }
    }
}
</script>

<style scoped>
.subject-column {
    width: 300px;
    box-sizing: border-box;
}
.action-column {
    width: 340px;
    max-width: 340px;
    padding-top: 0;
    padding-bottom: 0;
    vertical-align: middle;
}
</style>
