<template>
    <VBox>
        <HBox class="background-gradient-1">
            <button @click="editor.chain().focus().toggleBold().run()" >
                <font-awesome-icon icon="fa-solid fa-bold" />
            </button>
            <button @click="editor.chain().focus().toggleItalic().run()">
                <font-awesome-icon icon="fa-solid fa-italic" />
            </button>
            <button @click="editor.chain().focus().toggleUnderline().run()">
                <font-awesome-icon icon="fa-solid fa-underline" />
            </button>
        </HBox>
        <editor-content class="flex-grow-1 horizontal-flexbox" :editor="editor" />
    </VBox>
</template>

<script setup lang="ts">
import { useEditor, EditorContent, Editor } from "@tiptap/vue-3";
import Document from "@tiptap/extension-document";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Underline from "@tiptap/extension-underline";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import HBox from "./HBox.vue";
import VBox from "./VBox.vue";
import { onBeforeUnmount, ShallowRef, onBeforeUpdate } from "vue";

const props = defineProps({
    modelValue: {
        type: String,
        default: "",
    },
});
const emit = defineEmits(["update:modelValue"]);

const editor = useEditor({
    extensions: [Document, Paragraph, Text, Bold, Italic, Underline],
    content: props.modelValue,
    onUpdate: () => {
        emit("update:modelValue", editor.value.getHTML())
    },
}) as ShallowRef<Editor>;

onBeforeUnmount(() => {
    editor.value.destroy();
});

onBeforeUpdate(() => {
    editor.value.commands.setContent(props.modelValue);
});

</script>
  