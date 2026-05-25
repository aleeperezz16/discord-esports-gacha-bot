import { Client, Collection, ChatInputCommandInteraction } from 'discord.js';

export interface Command {
  data: {
    name: string;
    toJSON(): unknown;
  };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface ExtendedClient extends Client {
  commands: Collection<string, Command>;
}
