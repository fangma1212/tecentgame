# 这一秒，想到你

把听歌时想到一个人的瞬间，做成可以播放、打开和回应的音乐明信片。这是腾讯音乐创新音乐产品赛道的双人参赛原型，面向不懂乐理、但喜欢听音乐的人。

## 体验流程

1. 选择三首原创试听曲之一，或导入自己有权分享的本地 MP3 / WAV / M4A / OGG 文件（8 秒至 5 分钟、20 MB 内；以浏览器解码能力为准）。
2. 试听并选取 8—20 秒。导入歌曲时，页面会按平均音频能量给出约 12 秒的推荐起点；用户仍可拖动范围或在播放时留下当前片段。推荐不等于副歌、歌词或情绪识别。
3. 写留言、收信人称呼和署名，选择卡片主题，实时预览。
4. 生成独立链接。收信人打开、听歌，可以留一句话，也可以用另一段音乐回信。
5. 回信时自动对调称呼，原信与回信保存在同一段音乐往来中。双方可以继续回复、逐封打开听，刷新查看新回信；更早的记录可以分页加载。

整首导入歌曲只在当前页面解码。寄出时仅把选中的片段转成 WAV 存入 R2；卡片、音乐往来、歌曲元数据和文字回应存入 D1。未寄出的草稿按原信分别保存在当前浏览器，刷新后需重新导入整首歌曲；已保存的短片段不需要重新导入。项目未接入商业音乐平台曲库，也不会代替用户发送消息。

音乐往来按链接访问，未提供参与者身份认证。持有同一段往来中任一明信片链接、且有站点访问权限的人可以读取整段往来；不要把它当作仅双方可读的私人聊天。

## 本地运行

需要 Node.js 22.13 或更高版本。

```sh
npm ci
npm run build
```

首次使用本地数据库时，按顺序执行迁移：

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_quick_iron_fist.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_neat_speed_demon.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_music_replies.sql
```

已执行过迁移的数据库不要重复执行。启动开发服务：

```sh
npm run dev
```

类型检查使用 `npx tsc --noEmit`；构建使用 `npm run build`。本地预览数据库与线上数据分开。

## 代码位置

- `app/studio.tsx`、`app/visuals.tsx`、`app/receiver.tsx`：制作、明信片视觉与收信体验。
- `lib/sound.ts`：原创合成曲、导入、推荐片段、播放与片段导出。
- `app/api/`、`db/`、`drizzle/`：卡片、回应和音频的存储接口及结构。
- `public/coastal-dusk.png`：明信片封面图；来源见 [ASSETS.md](ASSETS.md)。
- [QA.md](QA.md)：已验证流程和提交比赛前的待办。
- [DEMO.md](DEMO.md)：三分钟演示顺序与真实听众试用记录方法。

仓库仅包含源码与静态素材，不包含已生成的明信片、回应或用户导入的歌曲。站点访问范围以 Sites 中的实际设置为准；2026-10-05 更新前检查为公开，更新保留了这一范围。
