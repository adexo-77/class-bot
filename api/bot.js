const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);
const MASTER_ADMIN_ID = parseInt(process.env.ADMIN_ID);

bot.command('post_material', async (ctx) => {
  if (ctx.from.id !== MASTER_ADMIN_ID) return;
  
  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
    return ctx.reply('You must reply to a document with this command to post it.');
  }

  const fileId = ctx.message.reply_to_message.document.file_id;
  const input = ctx.message.text.replace('/post_material ', '').split('|');
  const category = input[0].trim().toLowerCase();
  const title = input[1] ? input[1].trim() : 'New Material';

  const { data: topicData } = await supabase
    .from('topic_mapping')
    .select('thread_id')
    .eq('category_name', category)
    .single();

  if (!topicData) return ctx.reply('Topic category not found in database.');

  await supabase.from('class_resources').insert({
    category: category,
    title: title,
    file_id: fileId
  });

  await ctx.telegram.sendDocument(ctx.chat.id, fileId, {
    caption: `📚 **${title}**\nUploaded by Admin`,
    parse_mode: 'Markdown',
    message_thread_id: topicData.thread_id 
  });
  
  ctx.reply('✅ Material posted successfully to the designated topic.');
});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    await bot.handleUpdate(req.body);
  }
  res.status(200).send('OK');
};