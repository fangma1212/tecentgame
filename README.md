# 这一秒，想到你

把听歌时想到一个人的瞬间，做成可以播放、打开和回应的音乐明信片。这是腾讯音乐创新音乐产品赛道的双人参赛原型，面向不懂乐理、但喜欢听音乐的人。

## 体验流程

1. 选择三首原创试听曲之一，或导入自己有权分享的本地 MP3 / WAV / M4A / OGG 文件（8 秒至 5 分钟、20 MB 内；以浏览器解码能力为准）。
2. 试听并选取 8—20 秒。导入歌曲时，页面会按平均音频能量给出约 12 秒的推荐起点；用户仍可拖动范围或在播放时留下当前片段。推荐不等于副歌、歌词或情绪识别。
3. 写留言、收信人称呼和署名，选择卡片主题，实时预览。
4. 生成独立链接。收信人打开、听歌并回应；寄信人可以刷新查看回应。

整首导入歌曲只在当前页面解码。寄出时仅把选中的片段转成 WAV 存入 R2；卡片、歌曲元数据和回应存入 D1。未寄出的文字草稿保存在当前浏览器，刷新后需重新导入整首歌曲。项目未接入商业音乐平台曲库，也不会代替用户发送消息。

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

仓库仅包含源码与静态素材，不包含已生成的明信片、回应或用户导入的歌曲。线上站点目前为私有预览，给队友或评委访问前需配置访问范围。
