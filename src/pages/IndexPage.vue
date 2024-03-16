<!-- 主页组件 -->
<template>
  <yu-terminal
    ref="terminalRef"
    :user="loginUser"
    full-screen
    :on-submit-command="onSubmitCommand"
  />
</template>

<script setup lang="ts">
import { doCommandExecute } from "../core/commandExecutor";
import { onMounted, ref } from "vue";
import { useUserStore } from "../core/commands/user/userStore";
import { storeToRefs } from "pinia";

const terminalRef = ref();

//捕获输入文本
const onSubmitCommand = async (inputText: string) => {
  if (!inputText) {
    return;
  }
  const terminal = terminalRef.value.terminal;
  // 将命令和终端对象传给命令系统
  await doCommandExecute(inputText, terminal);
};

const userStore = useUserStore();
const { loginUser } = storeToRefs(userStore);

onMounted(() => {
  userStore.getAndSetLoginUser();
});
</script>

<style></style>
