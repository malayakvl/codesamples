<template>
    <div class="plan-info column" v-bind:class="{ active: isConnected }" ref="plan-info">
        <div class="form">
            <form method="post" enctype="multipart/form-data">
                <div class="form-block">
                    <span class="section-title">Опис заняття </span>
                    <div class="alert alert-danger alert-messages-list offset-bottom-large" v-if="errors.length > 0">
                        <ul>
                            <li class="message" v-for="error in errors">{{ error }}</li>
                        </ul>
                    </div>
                    <div class="description form-group">
                        <textarea
                            id="currPlanDescription"
                            name="currPlanDescription"
                            class="input-component"
                            autocomplete="off"
                            v-model="currDescription"
                        />

                        <div v-if="item.id === planId && lessonId">
                                <ul class="file-upload-list">
                                    <li v-for="file in filesUploaded" class="uploaded">
                                        <a :href="`/storage${file.path}`" target="_blank">{{file.original_name}}</a>
                                        <span @click="removeFile(file.fileId, 'description')" class="remove"  title="Видалити"><i class="fas fa-trash"></i></span>
                                    </li>
                                    <li v-for="file in files" v-bind:class="{error: uploadErrors[file.name]}">
                                        {{file.name}} <em>{{uploadErrors[file.name]}}</em>
                                        <span @click="removeUploadedFile(file, 'description')" class="remove"  title="Видалити"><i class="fas fa-trash"></i></span>
                                    </li>
                                </ul>
                                <label class="add-file">
                                    <i class="fas fa-upload"></i>
                                    <input type="file" id="files" ref="files" multiple v-on:change="onChange()"/>
                                </label>
                        </div>
                    </div>
                </div>

                <div class="form-block"  v-if="item.id === planId && lessonId">
                    <div class="home-block">
                        <span class="section-title">Домашнє завдання</span>
                        <div class="description form-group">
                        <textarea
                            id="currPlanHome"
                            name="currPlanHome"
                            class="input-component"
                            autocomplete="off"
                            v-model="currPlanHome"
                        />
                            <div>
                                <ul class="file-upload-list">
                                    <li v-for="file in filesHomeUploaded" class="uploaded">
                                        <a :href="`/storage${file.path}`" target="_blank">{{file.original_name}}</a>
                                        <span class="remove" @click="removeFile(file.fileId, 'home')" title="Видалити"><i class="fas fa-trash"></i></span>
                                    </li>
                                    <li v-for="file in filesHome" v-bind:class="{error: homeErrors[file.name]}">
                                        {{file.name}} <em>{{homeErrors[file.name]}}</em>
                                        <span @click="removeUploadedFile(file, 'home')" class="remove"  title="Видалити"><i class="fas fa-trash"></i></span>
                                    </li>
                                </ul>
                                <label class="add-file">
                                    <i class="fas fa-upload"></i>
                                    <input type="file" id="homeFiles" ref="homeFiles" multiple v-on:change="onChangeHome()"/>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-block" v-if="item.id === planId && lessonId">
                    <ToDoComments
                        :lessonId="lessonId"
                        :teacherId="teacherId"
                        :subjectId="subjectId"
                        :planId="planId"
                        :addCommentUrl="addCommentUrl"
                        :getCommentsUrl="getCommentsUrl"
                        :deleteCommentUrl="deleteCommentUrl"
                    />
                </div>

                <div class="form-block" v-if="item.id === planId && lessonId">
                    <div class="notice-block">
                        <span class="section-title">Заметки пользователя</span>
                        <div class="description form-group">
                            <textarea
                                id="currPlanNotice"
                                name="currPlanNotice"
                                class="input-component"
                                autocomplete="off"
                                v-model="currPlanNotice"
                            />
                            <div>
                                <ul class="file-upload-list">
                                    <li v-for="file in filesNoticeUploaded"  class="uploaded">
                                        <a :href="`/storage${file.path}`" target="_blank">{{file.original_name}}</a>
                                        <span class="remove" @click="removeFile(file.fileId, 'notice')"></span>
                                    </li>
                                    <li v-for="file in filesNotice" v-bind:class="{error: noticeErrors[file.name]}">
                                        {{file.name}} <em>{{noticeErrors[file.name]}}</em>
                                        <span @click="removeUploadedFile(file, 'notice')" class="remove"  title="Видалити"><i class="fas fa-trash"></i></span>
                                    </li>
                                </ul>
                                <label class="add-file">
                                    <i class="fas fa-upload"></i>
                                    <input type="file" id="noticeFiles" ref="noticeFiles" multiple v-on:change="onChangeNotice()"/>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-block" v-if="item.id === planId && lessonId">
                    <div class="uploaded-students-work">
                        <span class="section-title">Виконані домашні завдання {{gradebook.length}} з {{students.length}}</span>
                        <ul>
                            <li v-for="(student, index) in gradebook" v-bind:id="`plan-${student.id}`">
                                <a href="javascript:;" @click="toggleFileList(student.id)" class="student-link-name"><i class="fas fa-user"></i> {{student.full_name}}</a>
                                <ul v-if="student.files.length > 0" v-show="showHomeFiles[student.id]" class="file-upload-list">
                                    <li v-for="(file, _index) in student.files" v-bind:id="`file-${file.id}`">
                                        <a :href="`/storage${file.path}`" target="_blank">{{file.original_name}}</a>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="clearfix"></div>
                <button v-if="item.id === planId && lessonId"
                    type="button" @click="onSubmit"
                    class="button button-accent button-default button-small btn-purple">
                    Зберегти
                </button>
            </form>
        </div>
    </div>
</template>

<script>
import { PerfectScrollbar } from 'vue2-perfect-scrollbar'
import ToDoComments from "./ToDoComments";

export default {
    components: {
        PerfectScrollbar,
        ToDoComments,
    },
    props: [
        'item',
        'lessonId',
        'subjectId',
        'teacherId',
        'planId',
        'event',
        'isClicked',
        'showUnconnected',

        'addCommentUrl',
        'getCommentsUrl',
        'addHomeFilesUrl',
        'lessonPlanUrl',
        'fileRemoveUrl',
        'deleteInfoUrl',
        'deleteCommentUrl',

    ],
    data() {
        return {
            isDone : this.done,
            showHomeFiles: {},
            errors: [],
            files: [],
            filesUploaded:[],
            filesHome: [],
            filesHomeUploaded: [],
            filesNoticeUploaded: [],
            filesNotice: [],
            fileSelected: false,
            currDescription: '',
            commentCnt: 0,
            currPlanHome: '',
            currPlanNotice: '',
            itemDescription: this.item.description,
            isConnected: false,

            uploadErrors: {},
            homeErrors: {},
            noticeErrors: {},

            students: [],
            gradebook:[]
        }
    },
    mounted() {
    },
    watch: {
        planId: function(oldPlanId, newPlanId) {
            if (oldPlanId != newPlanId && this.isClicked) {
                this.filesUploaded = [];
                this.filesHomeUploaded = [];
                this.filesNoticeUploaded = [];
                this.currDescription = '';
                this.currPlanHome = '';
                this.currPlanNotice = '';
                this.commentCnt = 0;
                this.itemDescription = this.item.description;
                this.getInfo();
            }
        }
    },
    methods: {
        toggleFileList(studentId) {
            const showFiles = this.showHomeFiles;
            this.showHomeFiles = {};
            showFiles[studentId] = !showFiles[studentId];

            this.showHomeFiles = showFiles;
        },
        getInfo() {
            document.body.classList.add('lock-loading');
            axios.get(`${this.lessonPlanUrl}?lessonId=${this.lessonId}&planId=${this.planId}&subjectId=${this.subjectId}`)
                .then(response => response.data)
                .then(response => {
                    this.currDescription = this.itemDescription;
                    this.currPlanHome = response.data.plan.homework || '';
                    if (response.data.notice) {
                        this.currPlanNotice = response.data.notice.notice
                    }
                    this.filesUploaded = response.data.descriptionFiles;
                    this.filesHomeUploaded = response.data.homeworkFiles;
                    this.filesNoticeUploaded = response.data.noticeFiles;
                    this.students = response.data.students;
                    this.gradebook = response.data.gradebook

                    if (response.data.plan.description) {
                        this.currDescription = response.data.plan.description;
                    }
                    document.body.classList.remove('lock-loading');
                })
                .catch((e) => {
                    document.body.classList.remove('lock-loading');
                })
            ;
        },
        onChange(e) {
            for(let i=0;i<this.$refs.files.files.length;i++) {
                this.files.push(this.$refs.files.files[i]);
            }
            // this.files = this.$refs.files.files;
        },
        onChangeHome(e) {
            for(let i=0;i<this.$refs.homeFiles.files.length;i++) {
                this.filesHome.push(this.$refs.homeFiles.files[i]);
            }
            // this.filesHome = this.$refs.homeFiles.files;
        },
        onChangeNotice(e) {
            for(let i=0;i<this.$refs.noticeFiles.files.length;i++) {
                this.filesNotice.push(this.$refs.noticeFiles.files[i]);
            }
            // this.filesNotice = this.$refs.noticeFiles.files;
        },
        removeFile(fileId, type) {
            document.body.classList.add('lock-loading');
            axios.get(`${this.fileRemoveUrl}?id=${fileId}`)
                .then(response => response.data)
                .then(response => {
                    if (type === 'description') {
                        const indx = this.filesUploaded.findIndex(file => file.fileId === fileId);
                        if (indx >= 0) {
                            this.filesUploaded.splice(indx, 1);
                        }
                    } else if (type === 'home') {
                        const indx = this.filesHomeUploaded.findIndex(file => file.fileId === fileId);
                        if (indx >= 0) {
                            this.filesHomeUploaded.splice(indx, 1);
                        }
                    } else if (type === 'notice') {
                        const indx = this.filesNoticeUploaded.findIndex(file => file.fileId === fileId);
                        if (indx >= 0) {
                            this.filesNoticeUploaded.splice(indx, 1);
                        }
                    }
                    document.body.classList.remove('lock-loading');
                })
                .catch(() => {
                    document.body.classList.remove('lock-loading');
                })
            ;
        },
        removeUploadedFile(file, type) {
            if (type === 'description') {
                const index = this.files.findIndex(f => f === file);
                if (index >= 0) {
                    this.files.splice(index, 1);
                }
            }
            if (type === 'home') {
                const index = this.filesHome.findIndex(f => f === file);
                if (index >= 0) {
                    this.filesHome.splice(index, 1);
                }
            }
            if (type === 'notice') {
                const index = this.filesNotice.findIndex(f => f === file);
                if (index >= 0) {
                    this.filesNotice.splice(index, 1);
                }
            }
        },
        onSubmit() {
            let formData = new FormData();
            formData.append('schoolId', this.schoolId);
            formData.append('eventId', this.item.id);
            formData.append('planId', this.planId);
            formData.append('teacherId', this.teacherId);
            formData.append('subjectId', this.subjectId);
            formData.append('lessonId', this.lessonId);
            formData.append('description', this.currDescription);
            formData.append('homeDescription', this.currPlanHome);
            formData.append('notice', this.currPlanNotice);
            const  extensions = ['jpeg','jpg','png','gif','csv','txt','xlx','xlsx','pdf','zip','doc','docx','vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
            const uploadErrors = {};
            const noticeErrors = {};
            const homeErrors = {};
            for( let i = 0; i < this.files.length; i++ ){
                let file = this.files[i];
                const ext = this.files[i].type.split('/');
                if (!extensions.includes(ext[1]) || this.files[i].size > 10485760) {
                    uploadErrors[this.files[i].name] = 'Файл цього типу не дозволено, або розмір перевищує 10MB';
                }
                formData.append('files[' + i + ']', file);
            }

            for( let i = 0; i < this.filesHome.length; i++ ){
                let fileHome = this.filesHome[i];
                const ext = this.filesHome[i].type.split('/');
                if (!extensions.includes(ext[1]) || this.filesHome[i].size > 10485760) {
                    homeErrors[this.filesHome[i].name] = 'Файл цього типу не дозволено, або розмір перевищує 10MB';
                }
                formData.append('filesHome[' + i + ']', fileHome);
            }
            for( let i = 0; i < this.filesNotice.length; i++ ){
                let fileNotice = this.filesNotice[i];
                const ext = this.filesNotice[i].type.split('/');
                if (!extensions.includes(ext[1]) || this.filesNotice[i].size > 10485760) {
                    noticeErrors[this.filesNotice[i].name] = 'Файл цього типу не дозволено, або розмір перевищує 10MB';
                }
                formData.append('filesNotice[' + i + ']', fileNotice);
            }

            this.uploadErrors = uploadErrors;
            this.homeErrors = homeErrors;
            this.noticeErrors = noticeErrors;

            if (Object.keys(uploadErrors).length === 0 && Object.keys(homeErrors).length === 0 && Object.keys(noticeErrors).length === 0) {
                const $this = this;
                document.body.classList.add('lock-loading');
                axios.post( this.addHomeFilesUrl,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                ).then(function(response){
                    $this.errors = [];
                    if (response.data.success) {
                        $this.files = [];
                        $this.filesHome = [];
                        $this.filesNotice = [];
                        $this.filesUploaded = response.data.data.descriptionFiles;
                        $this.filesHomeUploaded = response.data.data.homeworkFiles;
                        $this.filesNoticeUploaded = response.data.data.noticeFiles;
                        // $this.isConnected = true;

                        $this.$emit('plan-added', {
                            item: response.data.data
                        });
                    } else {
                        const _errors = response.data.errors;
                        const errMessages = [];
                        errMessages.push('Дозволені лише jpeg,jpg,png,gif,csv,txt,xlx,xls,pdf,zip,doc,docx файли. Або перевищено ліміт розміру файлу')
                        $this.errors = errMessages;
                    }

                    document.body.classList.remove('lock-loading');
                })
                    .catch(function(response){
                        console.log('FAILURE!!', response);
                        document.body.classList.remove('lock-loading');
                    });
            }

        },
    }
}
</script>
