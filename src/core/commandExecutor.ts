import getopts, { ParsedOptions } from "getopts";
import { commandMap } from "./commandRegister";
import { CommandOptionType, CommandType } from "./command";
import TerminalType = YuTerminal.TerminalType;
import helpCommand from "./commands/terminal/help/helpCommand";

/**
 * 执行命令
 * @param text 输入字符串
 * @param terminal 终端
 * @param parentCommand
 */
// 命令系统的main函数
export const doCommandExecute = async (
  text: string,
  terminal: TerminalType,
  parentCommand?: CommandType
) => {
  //去除命令首尾空格
  text = text.trim();
  if (!text) {
    return;
  }
  // 解析文本，匹配命令
  const command: CommandType = getCommand(text, parentCommand);
  //匹配失败
  if (!command) {
    terminal.writeTextErrorResult("找不到命令");
    return;
  }
  // 解析参数（需传递不同的解析规则)
  //解析为js对象
  const parsedOptions = doParse(text, command.options);
  // 用户输入的参数数组
  const { _ } = parsedOptions;
  // 有子命令，执行
  if (
    _.length > 0 &&
    command.subCommands &&
    Object.keys(command.subCommands).length > 0
  ) {
    // 把子命令当做新命令解析，user login xxx => login xxx
    const subText = text.substring(text.indexOf(" ") + 1);
    await doCommandExecute(subText, terminal, command);
    return;
  }
  // 执行命令
  await doAction(command, parsedOptions, terminal, parentCommand);
};

/**
 * 获取命令（匹配）
 * @param text
 * @param parentCommand
 */
const getCommand = (text: string, parentCommand?: CommandType): CommandType => {
  let func = text.split(" ", 1)[0];
  // 大小写无关
  func = func.toLowerCase();
  // 取出命令集
  let commands = commandMap;
  // 有父命令，则从父命令中查找
  if (
    parentCommand &&
    parentCommand.subCommands &&
    Object.keys(parentCommand.subCommands).length > 0
  ) {
    commands = parentCommand.subCommands;
  }
  // 根据用户输入 得到执行命令
  const command = commands[func];
  console.log("getCommand = ", command);
  return command;
};

/**
 * 解析参数
 * @param text
 * @param commandOptions
 */
const doParse = (
  text: string,
  commandOptions: CommandOptionType[]
): getopts.ParsedOptions => {
  // 过滤掉关键词
  const args: string[] = text.split(" ").slice(1);
  // 转换的格式数组
  const options: getopts.Options = {
    alias: {},
    default: {},
    string: [],
    boolean: [],
  };
  // 格式转换为getopts库所需要的参数格式
  commandOptions.forEach((commandOption) => {
    const { alias, key, type, defaultValue } = commandOption;
    if (alias && options.alias) {
      options.alias[key] = alias;
    }
    options[type]?.push(key);
    if (defaultValue && options.default) {
      options.default[key] = defaultValue;
    }
  });
  const parsedOptions = getopts(args, options);
  console.log("parsedOptions = ", parsedOptions);
  return parsedOptions;
};

/**
 * 执行
 * @param command
 * @param options
 * @param terminal
 * @param parentCommand
 */
const doAction = async (
  command: CommandType,
  options: ParsedOptions,
  terminal: TerminalType,
  parentCommand?: CommandType
) => {
  const { help } = options;
  // 设置输出折叠
  if (command.collapsible || help) {
    terminal.setCommandCollapsible(true);
  }
  // 查看帮助
  // e.g. xxx --help => { _: ["xxx"] }
  if (help) {
    const newOptions = { ...options, _: [command.func] };
    helpCommand.action(newOptions, terminal, parentCommand);
    return;
  }
  // 命令执行
  // 命令的执行函数被定义在命令集里
  await command.action(options, terminal);
};
