<template>
    <div class="three-dots-action" ref="actionsContainer" v-bind:class="{active: isVisible}">
        <a href="javascript:" class="action-icon three-dots-action" @click="toggleActions()"><img svg-inline src="./../../svg/three_dots_vert-icon.svg" class="icon" /></a>
        <div class="actions" v-bind:class="{visible: isVisible}">
            <slot></slot>
        </div>
    </div>
</template>

<script>
export default {
    name: "ThreeDotsActions",
    data() {
        return {
            isVisible: false,
            onClickOutside: null
        }
    },
    mounted() {
        this.onClickOutside = (e) => this.clickOutside(e);
        document.addEventListener('click', this.onClickOutside);
    },
    beforeDestroy() {
        document.removeEventListener('click', this.onClickOutside);
    },
    methods: {
        clickOutside(e) {
            if (!this.isVisible) {
                return ;
            }

            let parent = e.target;
            let isInside = false;
            while (parent !== document.body) {
                if (parent === this.$refs.actionsContainer) {
                    isInside = true;
                }

                if (parent === null) {
                    break;
                }

                parent = parent.parentElement;
            }

            if (!isInside) {
                this.isVisible = false;
            }
        },
        toggleActions() {
            this.isVisible = !this.isVisible;
        }
    }
}
</script>

<style scoped>

</style>
