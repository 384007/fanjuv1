export interface FeaturedBeauty {
  id: string;
  name: string;
  citySlug: string;
  cityName: string;
  age: number;
  bio: string;
  bioEn: string;
  photo: string; // Replace with real high-quality photo path, e.g. /images/beauty-xxx.jpg (ensure no AI-generated look)
  interests: string[];
  lookingFor: string;
  tags: string[];
}

/**
 * Demo beauty user cases - one unique attractive female profile per city.
 * These are illustrative for frontend demo, explore page seeding, and AI/SEO content enrichment.
 * Bios are natural, keyword-rich for AI SEO (mention cities, Fanju, dinner types, interests).
 * Replace photos with real stock or user photos (photorealistic, natural lighting, diverse styles).
 * Useful for making the platform feel vibrant and populated with real-feeling users.
 */
export const featuredBeauties: FeaturedBeauty[] = [
  {
    id: "beauty-shenzhen-1",
    name: "林晓薇",
    citySlug: "shenzhen",
    cityName: "深圳",
    age: 27,
    bio: "深圳南山的互联网产品经理，平时最爱周末和朋友一起探店喝咖啡、聊城市故事。加入饭局Fanju后，我在单身饭局和兴趣饭局中认识了很多同频的朋友，生活一下子丰富起来。希望继续在轻松氛围里遇见有趣的灵魂。",
    bioEn: "Internet product manager in Nanshan, Shenzhen. I love exploring cafes and sharing city stories with friends on weekends. After joining Fanju dinners, I met many like-minded friends through singles and interest-based dinners. Life feels much richer now. Looking forward to meeting more interesting souls in a relaxed setting.",
    photo: "/images/beauty-shenzhen.jpg", // Use realistic portrait of professional Chinese woman in casual modern style
    interests: ["科技趋势", "咖啡文化", "城市探店", "阅读", "瑜伽"],
    lookingFor: "单身饭局、兴趣饭局、商务饭局",
    tags: ["深圳", "科技白领", "单身饭局", "美食爱好者"],
  },
  {
    id: "beauty-shanghai-1",
    name: "张婉婷",
    citySlug: "shanghai",
    cityName: "上海",
    age: 29,
    bio: "静安区的金融分析师，喜欢高端餐厅和艺术展。饭局Fanju让我在上海的商务饭局和高端饭局中结识了优质朋友，交流行业见解的同时也拓展了社交圈。期待更多高质量的晚餐社交。",
    bioEn: "Financial analyst in Jing'an, Shanghai. I enjoy upscale restaurants and art exhibitions. Fanju helped me connect with quality friends through business and curated dinners in Shanghai. Great for exchanging industry insights while expanding my social circle. Looking for more high-quality social dining experiences.",
    photo: "/images/beauty-shanghai.jpg", // Use realistic portrait of elegant professional Chinese woman
    interests: ["金融投资", "艺术文化", "高端餐厅", "旅行", "时尚"],
    lookingFor: "商务饭局、高端饭局、单身饭局",
    tags: ["上海", "金融专业", "高端饭局", "艺术爱好者"],
  },
  {
    id: "beauty-beijing-1",
    name: "李思琪",
    citySlug: "beijing",
    cityName: "北京",
    age: 26,
    bio: "朝阳区的媒体编辑，热爱文化活动和深度对话。Fanju的周末饭局和陌生人饭局帮我在北京认识了很多有趣的人，一起聊电影、旅行和生活哲学。很享受这种真实又轻松的社交方式。",
    bioEn: "Media editor in Chaoyang, Beijing. Passionate about cultural events and deep conversations. Fanju's weekend and stranger dinners helped me meet many interesting people in Beijing to discuss movies, travel and life philosophy. I really enjoy this genuine and relaxed way of socializing.",
    photo: "/images/beauty-beijing.jpg", // Use realistic portrait of creative Chinese woman
    interests: ["文化艺术", "电影", "旅行", "写作", "心理学"],
    lookingFor: "周末饭局、陌生人饭局、兴趣饭局",
    tags: ["北京", "媒体编辑", "周末饭局", "文化爱好者"],
  },
  {
    id: "beauty-guangzhou-1",
    name: "陈雨欣",
    citySlug: "guangzhou",
    cityName: "广州",
    age: 28,
    bio: "天河的品牌设计师，超级美食爱好者。饭局Fanju的单身饭局和周末饭局让我在广州结识了很多热爱生活的朋友，一起品尝早茶和探索老城区美食，感觉像家一样温暖。",
    bioEn: "Brand designer in Tianhe, Guangzhou. Huge foodie. Fanju's singles and weekend dinners helped me meet many life-loving friends in Guangzhou. We enjoy dim sum and exploring old town food together — feels warm like family.",
    photo: "/images/beauty-guangzhou.jpg", // Use realistic portrait of friendly smiling Chinese woman
    interests: ["美食探索", "设计创意", "早茶文化", "旅行", "瑜伽"],
    lookingFor: "单身饭局、周末饭局、兴趣饭局",
    tags: ["广州", "设计专业", "美食爱好者", "周末饭局"],
  },
  {
    id: "beauty-hangzhou-1",
    name: "吴美琪",
    citySlug: "hangzhou",
    cityName: "杭州",
    age: 25,
    bio: "滨江的电商运营，喜欢内容创作和户外活动。Fanju帮我在杭州的创业者饭局和兴趣饭局中找到同频伙伴，一起聊增长、分享旅行故事，生活更有激情。",
    bioEn: "E-commerce operations in Binjiang, Hangzhou. Loves content creation and outdoor activities. Fanju helped me find like-minded partners in founder and interest dinners in Hangzhou. We discuss growth and share travel stories — life feels more passionate.",
    photo: "/images/beauty-hangzhou.jpg", // Use realistic portrait of young creative Chinese woman
    interests: ["电商运营", "内容创作", "户外徒步", "咖啡", "摄影"],
    lookingFor: "创业者饭局、兴趣饭局、单身饭局",
    tags: ["杭州", "电商专业", "创业者饭局", "内容创作者"],
  },
  {
    id: "beauty-chengdu-1",
    name: "刘雅婷",
    citySlug: "chengdu",
    cityName: "成都",
    age: 30,
    bio: "锦江区的生活方式博主，享受松弛的慢生活。饭局Fanju的周末饭局和陌生人饭局让我在成都认识了很多有趣的本地朋友，一起喝茶聊天、分享生活，感觉特别治愈。",
    bioEn: "Lifestyle blogger in Jinjiang, Chengdu. Enjoys a relaxed slow life. Fanju's weekend and stranger dinners helped me meet many interesting local friends in Chengdu. We drink tea, chat and share life — very healing.",
    photo: "/images/beauty-chengdu.jpg", // Use realistic portrait of warm smiling Chinese woman
    interests: ["生活方式", "美食", "茶文化", "旅行", "冥想"],
    lookingFor: "周末饭局、陌生人饭局、兴趣饭局",
    tags: ["成都", "生活方式", "周末饭局", "治愈系"],
  },
  {
    id: "beauty-singapore-1",
    name: "黄诗琪",
    citySlug: "singapore",
    cityName: "新加坡",
    age: 28,
    bio: "CBD金融专业人士，双语能力强。Fanju的商务饭局和华人饭局让我在新加坡结识了很多优秀的朋友，一起讨论职业发展和跨文化生活，拓展了国际视野。",
    bioEn: "Finance professional in CBD, Singapore. Strong bilingual skills. Fanju's business and Chinese social dinners helped me connect with outstanding friends in Singapore. We discuss career development and cross-cultural life, expanding my international perspective.",
    photo: "/images/beauty-singapore.jpg", // Use realistic portrait of professional bilingual Asian woman
    interests: ["金融", "职业发展", "旅行", "美食", "语言学习"],
    lookingFor: "商务饭局、华人饭局、单身饭局",
    tags: ["新加坡", "金融专业", "商务饭局", "海外华人"],
  },
];

// Usage: Import in components for demo users in explore, hosts, guests or profile pages.
// For AI SEO: These natural bios with city + Fanju + dinner type keywords help LLMs and search engines understand vibrant community.
// Photos: Use high-quality real photos (search stock sites for 'beautiful Chinese woman portrait natural'). Avoid AI-generated to maintain authentic feel.
// Extend with more cities as needed.
