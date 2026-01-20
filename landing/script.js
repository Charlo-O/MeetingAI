(function () {
  'use strict';

  var dict = {
    zh: {
      'nav.lang': '中·EN',
      'hero.title': '会议录音助手',
      'hero.tagline': '把会议录下来，把信息讲清楚。',
      'hero.desc': '录音、转文字、生成总结。总结用于快读，原文用于追溯；支持编辑原文后重新生成总结。',
      'hero.ctaPrimary': '下载 Releases',
      'hero.ctaPrimarySub': 'Android APK · 安装包',
      'hero.ctaSecondary': '查看 GitHub',
      'hero.ctaSecondarySub': '源码 · Issue · Roadmap',
      'hero.meta1': '本地存储会议记录',
      'hero.meta2': 'OpenAI 兼容接口',
      'hero.meta3': '支持长录音分段',

      'shots.home': '会议列表',
      'shots.record': '录音',
      'shots.summary': '总结',
      'shots.settings': '设置',

      'showcase.title': '产品截图',
      'showcase.desc': '轻拟物界面：用凹凸表达层级，让信息更耐看。',
      'showcase.home': '首页：会议列表',
      'showcase.homeSub': '状态清晰，快速回顾',
      'showcase.recording': '录音中',
      'showcase.recordingSub': '脉冲动效反馈采集中',
      'showcase.summary': '总结',
      'showcase.summarySub': 'Markdown 结构化呈现',
      'showcase.transcript': '原文',
      'showcase.transcriptSub': '可编辑并重新生成总结',
      'showcase.settings': '设置',
      'showcase.settingsSub': '配置 STT · LLM · TTS',

      'features.title': '核心能力',
      'features.desc': '从采集到输出，一条链路完成；同时保留可追溯的“原始证据”。',
      'features.f1.title': '长录音分段',
      'features.f1.desc': '每 5 分钟自动保存一段，支持任意时长录音，降低意外丢失风险。',
      'features.f2.title': '语音转文字',
      'features.f2.desc': '支持 Whisper 及兼容接口，转录完成后可手动修正文案。',
      'features.f3.title': 'AI 总结',
      'features.f3.desc': '一键生成结构化总结，用于快读与复盘；原文作为可追溯来源。',
      'features.f4.title': '本地存储',
      'features.f4.desc': '会议记录与配置持久化在本地，列表回顾快速、离线可查看。',
      'features.f5.title': '复制与分享',
      'features.f5.desc': '总结与原文可一键复制或分享，方便同步到协作工具与文档。',
      'features.f6.title': '可编辑原文',
      'features.f6.desc': '修正识别错误后重新生成总结，让最终输出更可靠、更贴近真实会议。',

      'how.title': '如何使用',
      'how.desc': '三步完成：配置 → 录音 → 回顾与输出。',
      'how.s1.title': '配置 API',
      'how.s1.desc': '在设置页填入 STT 与 LLM 的 Key；可选配置 TTS 朗读总结。',
      'how.s2.title': '开始录音',
      'how.s2.desc': '点击麦克风开始采集；长会议自动分段保存，安心记录。',
      'how.s3.title': '生成总结并回顾',
      'how.s3.desc': '转录 + 总结完成后，在详情页查看；原文可编辑并重新生成总结。',
      'how.calloutTitle': '你真正需要的是“可追溯的总结”',
      'how.calloutSub': '总结用于快读，原文用于核对；两者缺一不可。',

      'footer.sub': '会议录音助手 · Light Skeuomorphism',
      'footer.link1': '截图',
      'footer.link2': '能力',
      'footer.link3': '使用',
      'footer.link4': 'GitHub',
      'footer.copy': '© MeetingAI. All rights reserved.'
    },

    en: {
      'nav.lang': 'EN·中',
      'hero.title': 'Meeting Recorder',
      'hero.tagline': 'Record it. Understand it. Share it.',
      'hero.desc': 'Record, transcribe, summarize. Skim the summary, verify with the transcript, and regenerate after edits.',
      'hero.ctaPrimary': 'Download Releases',
      'hero.ctaPrimarySub': 'Android APK · Packages',
      'hero.ctaSecondary': 'View on GitHub',
      'hero.ctaSecondarySub': 'Source · Issues · Roadmap',
      'hero.meta1': 'Local meeting library',
      'hero.meta2': 'OpenAI-compatible APIs',
      'hero.meta3': 'Segmented long recordings',

      'shots.home': 'Library',
      'shots.record': 'Record',
      'shots.summary': 'Summary',
      'shots.settings': 'Settings',

      'showcase.title': 'Screenshots',
      'showcase.desc': 'Light neumorphism: depth through concave and convex surfaces.',
      'showcase.home': 'Library',
      'showcase.homeSub': 'Clear status, quick review',
      'showcase.recording': 'Recording',
      'showcase.recordingSub': 'Pulse feedback while capturing',
      'showcase.summary': 'Summary',
      'showcase.summarySub': 'Structured with Markdown',
      'showcase.transcript': 'Transcript',
      'showcase.transcriptSub': 'Editable, then regenerate summary',
      'showcase.settings': 'Settings',
      'showcase.settingsSub': 'Configure STT · LLM · TTS',

      'features.title': 'Core Capabilities',
      'features.desc': 'One flow end-to-end, with a traceable source transcript.',
      'features.f1.title': 'Segmented Recording',
      'features.f1.desc': 'Auto-saves every ~5 minutes. Record as long as you need with less risk.',
      'features.f2.title': 'Speech-to-Text',
      'features.f2.desc': 'Whisper and compatible APIs. Edit the transcript after transcription.',
      'features.f3.title': 'AI Summary',
      'features.f3.desc': 'Generate structured summaries for quick review, backed by the transcript.',
      'features.f4.title': 'Local Storage',
      'features.f4.desc': 'Meetings and settings are stored locally for fast access.',
      'features.f5.title': 'Copy & Share',
      'features.f5.desc': 'Copy or share summary and transcript to docs and collaboration tools.',
      'features.f6.title': 'Editable Transcript',
      'features.f6.desc': 'Fix recognition errors and regenerate a more reliable summary.',

      'how.title': 'How It Works',
      'how.desc': 'Three steps: set up → record → review & export.',
      'how.s1.title': 'Configure APIs',
      'how.s1.desc': 'Set STT and LLM keys in Settings. Optional: TTS to read summaries.',
      'how.s2.title': 'Start Recording',
      'how.s2.desc': 'Tap the mic. Long meetings are saved in segments.',
      'how.s3.title': 'Review & Generate',
      'how.s3.desc': 'Transcribe + summarize, then review. Edit transcript and regenerate if needed.',
      'how.calloutTitle': 'You want summaries you can verify',
      'how.calloutSub': 'Skim the summary, then validate with the transcript.',

      'footer.sub': 'Meeting Recorder · Light Neumorphism',
      'footer.link1': 'Screens',
      'footer.link2': 'Features',
      'footer.link3': 'How-to',
      'footer.link4': 'GitHub',
      'footer.copy': '© MeetingAI. All rights reserved.'
    }
  };

  function setLang(lang) {
    var root = document.documentElement;
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang === 'zh' ? 'zh' : 'en');

    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var key = el.getAttribute('data-i18n');
      var v = dict[lang] && dict[lang][key];
      if (typeof v === 'string') el.textContent = v;
    }

    try {
      localStorage.setItem('meetingai_lang', lang);
    } catch (_) {
      // ignore
    }
  }

  function getInitialLang() {
    try {
      var saved = localStorage.getItem('meetingai_lang');
      if (saved === 'zh' || saved === 'en') return saved;
    } catch (_) {
      // ignore
    }
    return 'zh';
  }

  var lang = getInitialLang();
  setLang(lang);

  var btn = document.getElementById('langToggle');
  if (btn) {
    btn.addEventListener('click', function () {
      lang = lang === 'zh' ? 'en' : 'zh';
      setLang(lang);
    });
  }
})();
