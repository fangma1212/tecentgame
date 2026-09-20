import {sqliteTable,text,integer,index,uniqueIndex} from 'drizzle-orm/sqlite-core';
export const audioClips=sqliteTable('moment_audio',{
  id:text('id').primaryKey(),title:text('title').notNull(),artist:text('artist').notNull(),duration:integer('duration').notNull(),sourceStart:integer('source_start').notNull(),digest:text('digest').notNull(),createdAt:integer('created_at').notNull(),
});
export const cards=sqliteTable('moment_cards',{
  id:text('id').primaryKey(),requestKey:text('request_key').notNull(),track:text('track').notNull(),start:integer('clip_start').notNull(),end:integer('clip_end').notNull(),message:text('message').notNull(),toName:text('to_name').notNull(),fromName:text('from_name').notNull(),theme:text('theme').notNull(),createdAt:integer('created_at').notNull(),
},t=>[uniqueIndex('idx_cards_request_key').on(t.requestKey)]);
export const replies=sqliteTable('moment_replies',{
  id:text('id').primaryKey(),cardId:text('card_id').notNull().references(()=>cards.id),requestKey:text('request_key').notNull(),name:text('name').notNull(),reaction:text('reaction').notNull(),message:text('message').notNull(),createdAt:integer('created_at').notNull(),
},t=>[index('idx_replies_card_time').on(t.cardId,t.createdAt),uniqueIndex('idx_replies_request_key').on(t.requestKey)]);
