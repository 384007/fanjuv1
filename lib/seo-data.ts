export type City = {
  slug: string
  name: string
  nameEn: string
  province: string
  provinceEn: string
  /** ISO-3166 alpha-2 country code used in schema.org addressCountry. Defaults to "CN". */
  countryCode?: string
  /** Chinese country label shown in copy. Defaults to 中国. */
  country?: string
  /** English country label shown in copy. Defaults to China. */
  countryEn?: string
  intro: string
  introEn: string
  answer: string
  answerEn: string
  /** 2–3 bullet points specific to this city, shown on city×category pages */
  highlights?: string[]
  highlightsEn?: string[]
}

export type Category = {
  slug: string
  name: string
  nameEn: string
  audience: string
  audienceEn: string
  intro: string
  introEn: string
  answer: string
  answerEn: string
  /** 2–3 actionable tips specific to this category, shown on city×category pages */
  tips?: string[]
  tipsEn?: string[]
}

export type Question = {
  slug: string
  title: string
  titleEn: string
  answer: string
  answerEn: string
  detail: string[]
  detailEn: string[]
}

export type Guide = {
  slug: string
  title: string
  titleEn: string
  answer: string
  answerEn: string
  sections: { title: string; body: string }[]
  sectionsEn: { title: string; body: string }[]
}

export type Template = {
  slug: string
  title: string
  titleEn: string
  description: string
  body: string
}

export type QuestionPage = {
  slug: string
  title: string
  titleEn: string
  answer: string
  answerEn: string
  tips: string[]
}

export const cities: City[] = [
  {
    slug: "shenzhen",
    name: "深圳",
    nameEn: "Shenzhen",
    province: "广东",
    provinceEn: "Guangdong",
    intro: "深圳是中国科技创业和出海的核心城市，饭局优先覆盖科技、金融、跨境电商、出海创业和年轻白领人群。南山（科技园、后海）、福田（CBD、车公庙）、罗湖是深圳饭局的核心区域，交通便利、餐厅密集。深圳流动人口多，新移民饭局和陌生人饭局需求旺盛，适合刚到深圳希望快速建立社交圈的人。",
    introEn: "Shenzhen is China's core city for tech startups and cross-border business. Dinners prioritize tech, finance, cross-border e-commerce, overseas startups and young professionals. Nanshan (Tech Park, Houhai), Futian (CBD, Chegongmiao) and Luohu are the core dinner districts — well-connected and restaurant-dense. Shenzhen's large transient population drives strong demand for newcomer and stranger dinners, ideal for people who have just arrived and want to build a social circle quickly.",
    answer: "深圳饭局以单身饭局、高端饭局、商务饭局、创业者饭局和周末饭局为主，优先招募南山、福田、罗湖的本地主办方与餐厅资源。适合科技、出海、跨境、电商、金融和年轻白领人群报名。",
    answerEn: "Shenzhen dinners cover singles, curated, business, founder and weekend formats. Fanju is prioritizing host and venue recruitment in Nanshan, Futian and Luohu. Suited for tech, cross-border, e-commerce, finance and young professional communities.",
    highlights: ["南山、福田、罗湖是深圳饭局的核心区域，科技园、后海、CBD 餐厅密集。", "深圳流动人口多，新移民饭局和陌生人饭局需求旺盛，适合刚到深圳的人。", "科技与出海圈层活跃，商务饭局和创业者饭局优先招募，跨境电商和 AI 圈层尤为集中。"],
    highlightsEn: ["Nanshan, Futian and Luohu are Shenzhen's core dinner districts — Tech Park, Houhai and CBD are restaurant-dense.", "Shenzhen's large transient population drives strong demand for newcomer and stranger dinners.", "The tech and cross-border business scene is active — business and founder dinners are a priority, especially for cross-border e-commerce and AI communities."],
  },
  {
    slug: "guangzhou",
    name: "广州",
    nameEn: "Guangzhou",
    province: "广东",
    provinceEn: "Guangdong",
    intro: "广州饭局适合生活节奏稳定、重视真实交流的同城用户，覆盖天河、珠江新城、越秀等核心区域。",
    introEn: "Guangzhou dinners suit residents who value authentic local connection, covering Tianhe, Pearl River New Town and Yuexiu districts.",
    answer: "广州饭局正在招募中，适合报名单身饭局、商务饭局、周末饭局与高端餐厅社交。",
    answerEn: "Guangzhou is currently recruiting hosts. Singles, business, weekend and curated dinner formats are open for early sign-ups.",
    highlights: ["天河、珠江新城、越秀是广州饭局的核心区域，餐饮文化浓厚。", "广州生活节奏稳定，周末饭局和高端饭局需求较高。", "大湾区跨城社交活跃，适合与深圳、佛山、东莞用户联动。"],
    highlightsEn: ["Tianhe, Pearl River New Town and Yuexiu are Guangzhou's core dinner districts, with a rich dining culture.", "Guangzhou's stable lifestyle pace drives strong demand for weekend and curated dinners.", "Greater Bay Area cross-city socializing is active — good for connecting with users from Shenzhen, Foshan and Dongguan."],
  },
  {
    slug: "shanghai",
    name: "上海",
    nameEn: "Shanghai",
    province: "上海",
    provinceEn: "Shanghai",
    intro: "上海是中国金融、时尚、海归和商务社交的核心城市，饭局面向金融、咨询、互联网、品牌、海归与创业者，适合需要高质量线下社交的人群。静安（南京西路、静安寺）、徐汇（衡山路、徐家汇）、黄浦（外滩、新天地）是上海饭局的核心区域，高端餐厅资源丰富。上海海归和外企人群多，单身饭局和高端饭局需求旺盛。",
    introEn: "Shanghai is China's core city for finance, fashion, returnees and business socializing. Dinners target finance, consulting, internet, brand, returnees and founders — people who need high-quality in-person social connections. Jing'an (West Nanjing Road, Jing'an Temple), Xuhui (Hengshan Road, Xujiahui) and Huangpu (Bund, Xintiandi) are the core dinner districts, with abundant upscale restaurant options. Shanghai's large returnee and foreign enterprise population drives strong demand for singles and curated dinners.",
    answer: "上海饭局优先开放高端饭局、商务饭局、创业者饭局和单身饭局，报名以真实资料和主办方审核为准。适合金融、咨询、互联网、品牌、海归和创业者人群。",
    answerEn: "Shanghai prioritizes curated, business, founder and singles dinner formats. RSVPs require real profiles and host review. Suited for finance, consulting, internet, brand, returnee and founder communities.",
    highlights: ["静安、徐汇、黄浦是上海饭局的核心区域，外滩、新天地、衡山路高端餐厅资源丰富。", "上海海归和外企人群多，单身饭局和高端饭局需求旺盛，留学生饭局也有较高需求。", "金融和创业圈层活跃，商务饭局和创业者饭局优先开放，适合 VC、PE、咨询和互联网人群。"],
    highlightsEn: ["Jing'an, Xuhui and Huangpu are Shanghai's core dinner districts — the Bund, Xintiandi and Hengshan Road have abundant upscale restaurant options.", "Shanghai's large returnee and foreign enterprise population drives strong demand for singles and curated dinners, with student dinners also in high demand.", "The finance and startup scene is active — business and founder dinners are a priority, suited for VC, PE, consulting and internet professionals."],
  },
  {
    slug: "beijing",
    name: "北京",
    nameEn: "Beijing",
    province: "北京",
    provinceEn: "Beijing",
    intro: "北京是中国互联网、媒体、投资和文化的核心城市，饭局覆盖科技、媒体、投资、文化、咨询与高校圈层，强调可信报名与线下真实交流。朝阳（三里屯、望京、国贸）、海淀（中关村、五道口）、东城（南锣鼓巷、东直门）是北京饭局的核心区域。北京高校资源丰富，留学生饭局和创业者饭局需求较高，投资和媒体圈层活跃。",
    introEn: "Beijing is China's core city for internet, media, investment and culture. Dinners cover tech, media, investment, culture, consulting and university circles, with an emphasis on trusted RSVPs and genuine in-person exchange. Chaoyang (Sanlitun, Wangjing, Guomao), Haidian (Zhongguancun, Wudaokou) and Dongcheng (Nanluoguxiang, Dongzhimen) are the core dinner districts. Beijing's rich university ecosystem drives demand for student and founder dinners, and the investment and media scene is active.",
    answer: "北京饭局适合希望拓展同城人脉、认识同频朋友或参与周末晚餐社交的用户，优先覆盖互联网、媒体、投资、文化和高校圈层。",
    answerEn: "Beijing dinners suit people looking to expand their local network, meet like-minded peers or join weekend social dining. Priority focus on internet, media, investment, culture and university circles.",
    highlights: ["朝阳、海淀、东城是北京饭局的核心区域，三里屯、望京、中关村、五道口餐厅密集。", "北京高校资源丰富，留学生饭局和创业者饭局需求较高，适合高校周边场次。", "投资和媒体圈层活跃，商务饭局和高端饭局优先招募，互联网和文化圈层也有较高需求。"],
    highlightsEn: ["Chaoyang, Haidian and Dongcheng are Beijing's core dinner districts — Sanlitun, Wangjing, Zhongguancun and Wudaokou are restaurant-dense.", "Beijing's rich university ecosystem drives demand for student and founder dinners, especially near university campuses.", "The investment and media scene is active — business and curated dinners are a priority, with strong demand from internet and culture communities."],
  },
  {
    slug: "hangzhou",
    name: "杭州",
    nameEn: "Hangzhou",
    province: "浙江",
    provinceEn: "Zhejiang",
    intro: "杭州饭局面向互联网、电商、内容、设计、创业与新消费人群，适合轻松但有质量的晚餐社交。",
    introEn: "Hangzhou dinners target internet, e-commerce, content, design, startups and new consumer sectors — relaxed but quality social dining.",
    answer: "杭州饭局正在招募主办方，优先覆盖单身饭局、创业者饭局、商务饭局与周末饭局。",
    answerEn: "Hangzhou is recruiting hosts, prioritizing singles, founder, business and weekend dinner formats.",
    highlights: ["西湖、滨江、余杭是杭州饭局的核心区域，互联网和电商圈层密集。", "杭州创业氛围浓厚，创业者饭局和商务饭局需求旺盛。", "新消费和内容圈层活跃，兴趣饭局和周末饭局适合优先开放。"],
    highlightsEn: ["West Lake, Binjiang and Yuhang are Hangzhou's core dinner districts, dense with internet and e-commerce professionals.", "Hangzhou's strong startup culture drives demand for founder and business dinners.", "The new consumer and content scene is active, making interest-based and weekend dinners a good fit."],
  },
  {
    slug: "chengdu",
    name: "成都",
    nameEn: "Chengdu",
    province: "四川",
    provinceEn: "Sichuan",
    intro: "成都饭局重视松弛、兴趣和城市生活方式，适合想认识新朋友、同城搭子和行业伙伴的人。",
    introEn: "Chengdu dinners value a relaxed pace, shared interests and city lifestyle — great for meeting new friends, local companions and industry peers.",
    answer: "成都饭局适合报名周末饭局、陌生人饭局、单身饭局和高端饭局，具体场次以开放城市为准。",
    answerEn: "Chengdu covers weekend, stranger, singles and curated dinner formats. Specific sessions depend on city opening schedule.",
    highlights: ["锦江、武侯、高新是成都饭局的核心区域，餐饮文化丰富、生活节奏松弛。", "成都年轻人社交需求旺盛，陌生人饭局和周末饭局适合优先开放。", "文旅和消费圈层活跃，兴趣饭局和高端饭局有较高需求。"],
    highlightsEn: ["Jinjiang, Wuhou and Gaoxin are Chengdu's core dinner districts, with a rich dining culture and relaxed pace.", "Chengdu's young population has strong social needs, making stranger and weekend dinners a good fit.", "The tourism and consumer scene is active, driving demand for interest-based and curated dinners."],
  },
  {
    slug: "xiamen",
    name: "厦门",
    nameEn: "Xiamen",
    province: "福建",
    provinceEn: "Fujian",
    intro: "厦门饭局适合新移民、海归、创业者、文旅与生活方式从业者，强调小桌真实交流。",
    introEn: "Xiamen dinners suit newcomers, returnees, founders, tourism and lifestyle professionals — small tables, genuine conversation.",
    answer: "厦门饭局即将开放，优先招募本地主办方、餐厅和高质量同城报名用户。",
    answerEn: "Xiamen is opening soon, prioritizing local host and venue recruitment alongside quality early sign-ups.",
  },
  {
    slug: "changsha",
    name: "长沙",
    nameEn: "Changsha",
    province: "湖南",
    provinceEn: "Hunan",
    intro: "长沙饭局适合传媒、消费、餐饮、文娱和年轻白领用户，适合通过晚餐拓展同城社交。",
    introEn: "Changsha dinners suit media, consumer, F&B, entertainment and young professional users looking to expand their local social circle.",
    answer: "长沙饭局正在筹备中，适合关注单身饭局、周末饭局和陌生人饭局的用户提前报名。",
    answerEn: "Changsha is in preparation. Early sign-ups are welcome for singles, weekend and stranger dinner formats.",
  },
  {
    slug: "nanjing",
    name: "南京",
    nameEn: "Nanjing",
    province: "江苏",
    provinceEn: "Jiangsu",
    intro: "南京饭局覆盖高校、金融、软件、制造业与年轻职场人，适合稳妥的同城线下饭局社交。",
    introEn: "Nanjing dinners cover universities, finance, software, manufacturing and young professionals — reliable local in-person social dining.",
    answer: "南京饭局即将开放，优先招募主办方并开放单身、商务、周末等饭局类型。",
    answerEn: "Nanjing is opening soon, prioritizing host recruitment and singles, business and weekend dinner formats.",
  },
  {
    slug: "suzhou",
    name: "苏州",
    nameEn: "Suzhou",
    province: "江苏",
    provinceEn: "Jiangsu",
    intro: "苏州饭局适合制造业、外企、园区科技、金融与新苏州人，帮助用户在同城建立真实连接。",
    introEn: "Suzhou dinners suit manufacturing, foreign enterprises, tech park workers, finance and newcomers — building genuine local connections.",
    answer: "苏州饭局适合关注商务饭局、单身饭局和新移民饭局的用户，城市场次会逐步开放。",
    answerEn: "Suzhou suits users interested in business, singles and newcomer dinner formats. City sessions will open gradually.",
  },
  {
    slug: "wuhan",
    name: "武汉",
    nameEn: "Wuhan",
    province: "湖北",
    provinceEn: "Hubei",
    intro: "武汉饭局覆盖高校、互联网、汽车、医疗、创业与年轻白领，适合周末小桌社交。",
    introEn: "Wuhan dinners cover universities, internet, automotive, healthcare, startups and young professionals — ideal for weekend small-table socializing.",
    answer: "武汉饭局正在招募中，优先支持周末饭局、陌生人饭局、单身饭局和商务饭局。",
    answerEn: "Wuhan is recruiting hosts, prioritizing weekend, stranger, singles and business dinner formats.",
  },
  {
    slug: "chongqing",
    name: "重庆",
    nameEn: "Chongqing",
    province: "重庆",
    provinceEn: "Chongqing",
    intro: "重庆饭局适合本地生活、文旅、消费、互联网与新移民人群，以轻松晚餐建立真实社交。",
    introEn: "Chongqing dinners suit local lifestyle, tourism, consumer, internet and newcomer communities — casual dinners for genuine social connection.",
    answer: "重庆饭局即将开放，适合希望参加周末饭局、陌生人饭局和高端饭局的用户。",
    answerEn: "Chongqing is opening soon. Weekend, stranger and curated dinner formats are available for early sign-ups.",
  },
  {
    slug: "xian",
    name: "西安",
    nameEn: "Xi'an",
    province: "陕西",
    provinceEn: "Shaanxi",
    intro: "西安饭局覆盖高校、硬科技、文旅、互联网和年轻职场人，适合同城兴趣与商务社交。",
    introEn: "Xi'an dinners cover universities, hard tech, tourism, internet and young professionals — interest-based and business social dining.",
    answer: "西安饭局正在筹备中，优先招募城市主办方并开放单身、周末、商务等饭局类型。",
    answerEn: "Xi'an is in preparation, prioritizing host recruitment and singles, weekend and business dinner formats.",
  },
  {
    slug: "qingdao",
    name: "青岛",
    nameEn: "Qingdao",
    province: "山东",
    provinceEn: "Shandong",
    intro: "青岛饭局适合海归、外企、制造业、贸易、文旅和本地生活方式用户。",
    introEn: "Qingdao dinners suit returnees, foreign enterprises, manufacturing, trade, tourism and local lifestyle users.",
    answer: "青岛饭局即将开放，适合关注高质量晚餐社交、周末饭局和新移民饭局的用户。",
    answerEn: "Qingdao is opening soon, suited for users interested in quality social dining, weekend and newcomer dinner formats.",
  },
  {
    slug: "zhengzhou",
    name: "郑州",
    nameEn: "Zhengzhou",
    province: "河南",
    provinceEn: "Henan",
    intro: "郑州饭局面向本地创业者、商务人士、年轻白领和新郑州人，强调可信报名与小桌交流。",
    introEn: "Zhengzhou dinners target local founders, business professionals, young white-collar workers and newcomers — trusted RSVPs and small-table conversation.",
    answer: "郑州饭局正在招募中，优先开放商务饭局、周末饭局、单身饭局和陌生人饭局。",
    answerEn: "Zhengzhou is recruiting hosts, prioritizing business, weekend, singles and stranger dinner formats.",
  },
  {
    slug: "foshan",
    name: "佛山",
    nameEn: "Foshan",
    province: "广东",
    provinceEn: "Guangdong",
    intro: "佛山饭局适合制造业、设计、家居、外贸和大湾区跨城社交人群。",
    introEn: "Foshan dinners suit manufacturing, design, home furnishing, foreign trade and Greater Bay Area cross-city social users.",
    answer: "佛山饭局即将开放，适合关注商务饭局、单身饭局和大湾区周末饭局的用户。",
    answerEn: "Foshan is opening soon, suited for business, singles and Greater Bay Area weekend dinner formats.",
  },
  {
    slug: "dongguan",
    name: "东莞",
    nameEn: "Dongguan",
    province: "广东",
    provinceEn: "Guangdong",
    intro: "东莞饭局覆盖制造业、外贸、电商、创业和大湾区年轻职场人，适合同城小桌社交。",
    introEn: "Dongguan dinners cover manufacturing, foreign trade, e-commerce, startups and Greater Bay Area young professionals — local small-table socializing.",
    answer: "东莞饭局正在招募主办方，优先支持商务饭局、周末饭局和新移民饭局。",
    answerEn: "Dongguan is recruiting hosts, prioritizing business, weekend and newcomer dinner formats.",
  },
  {
    slug: "zhuhai",
    name: "珠海",
    nameEn: "Zhuhai",
    province: "广东",
    provinceEn: "Guangdong",
    intro: "珠海饭局适合横琴、澳门周边、金融、科技、文旅与新移民人群。",
    introEn: "Zhuhai dinners suit Hengqin, Macau-adjacent, finance, tech, tourism and newcomer communities.",
    answer: "珠海饭局即将开放，适合报名高端饭局、周末饭局、商务饭局和新移民饭局。",
    answerEn: "Zhuhai is opening soon, suited for curated, weekend, business and newcomer dinner formats.",
  },
  {
    slug: "tianjin",
    name: "天津",
    nameEn: "Tianjin",
    province: "天津",
    provinceEn: "Tianjin",
    intro: "天津饭局面向金融、制造、港口贸易、高校和年轻职场人，适合同城真实晚餐社交。",
    introEn: "Tianjin dinners target finance, manufacturing, port trade, universities and young professionals — genuine local dinner socializing.",
    answer: "天津饭局正在筹备中，优先开放单身饭局、商务饭局、周末饭局和陌生人饭局。",
    answerEn: "Tianjin is in preparation, prioritizing singles, business, weekend and stranger dinner formats.",
  },
  {
    slug: "ningbo",
    name: "宁波",
    nameEn: "Ningbo",
    province: "浙江",
    provinceEn: "Zhejiang",
    intro: "宁波饭局适合外贸、制造、港口、金融和本地新青年，以小桌晚餐建立可信连接。",
    introEn: "Ningbo dinners suit foreign trade, manufacturing, port, finance and local young professionals — small-table dinners for trusted connections.",
    answer: "宁波饭局即将开放，适合关注商务饭局、高端饭局和周末饭局的用户提前报名。",
    answerEn: "Ningbo is opening soon. Early sign-ups are welcome for business, curated and weekend dinner formats.",
  },
  // ── Overseas Chinese-diaspora cities ──────────────────────────────
  {
    slug: "new-york",
    name: "纽约",
    nameEn: "New York",
    province: "纽约州",
    provinceEn: "New York",
    country: "美国",
    countryEn: "United States",
    countryCode: "US",
    intro: "纽约饭局覆盖曼哈顿、法拉盛、布鲁克林的华人圈，适合金融、科技、艺术和留学生人群。",
    introEn: "New York dinners cover the Chinese community across Manhattan, Flushing and Brooklyn — suited for finance, tech, creative and student circles.",
    answer: "纽约饭局优先开放华人饭局、留学生饭局、单身饭局和商务饭局，适合北美华人和国际留学生报名。",
    answerEn: "New York prioritizes Chinese social dining, student, singles and business dinner formats — open to North American Chinese communities and international students.",
    highlights: ["曼哈顿、法拉盛、布鲁克林华人密集，适合单身饭局和留学生饭局。", "华尔街和科技圈华人活跃，商务饭局和创业者饭局需求旺盛。", "纽约华人圈层跨行业，适合跨圈层的同频饭局。"],
    highlightsEn: ["Manhattan, Flushing and Brooklyn have dense Chinese communities — great for singles and student dinners.", "Wall Street and tech professionals drive strong demand for business and founder dinners.", "New York's cross-industry Chinese community suits like-minded cross-circle dinners."],
  },
  {
    slug: "san-francisco",
    name: "旧金山",
    nameEn: "San Francisco",
    province: "加利福尼亚",
    provinceEn: "California",
    country: "美国",
    countryEn: "United States",
    countryCode: "US",
    intro: "旧金山饭局面向湾区华人科技圈，覆盖 SF、南湾、东湾的工程师、PM、设计师与创业者。",
    introEn: "San Francisco dinners target the Bay Area Chinese tech community — engineers, PMs, designers and founders across SF, South Bay and the East Bay.",
    answer: "旧金山饭局优先开放创业者饭局、商务饭局、华人饭局和单身饭局。",
    answerEn: "San Francisco prioritizes founder, business, Chinese social and singles dinner formats.",
    highlights: ["湾区华人科技圈密集，创业者饭局和商务饭局需求旺盛。", "留学生和 H1B 群体适合优先报名单身饭局和新移民饭局。", "适合与南湾 Palo Alto、Cupertino 跨城联动。"],
    highlightsEn: ["The Bay Area Chinese tech community drives strong demand for founder and business dinners.", "International students and H1B visa holders fit well with singles and newcomer dinners.", "Good for cross-city connections with Palo Alto and Cupertino in the South Bay."],
  },
  {
    slug: "los-angeles",
    name: "洛杉矶",
    nameEn: "Los Angeles",
    province: "加利福尼亚",
    provinceEn: "California",
    country: "美国",
    countryEn: "United States",
    countryCode: "US",
    intro: "洛杉矶饭局覆盖 SGV、Irvine、橘郡华人圈，适合娱乐、文化、留学生与新移民群体。",
    introEn: "Los Angeles dinners cover the Chinese community across SGV, Irvine and Orange County — suited for entertainment, culture, students and newcomers.",
    answer: "洛杉矶饭局优先开放华人饭局、留学生饭局、周末饭局和新移民饭局。",
    answerEn: "Los Angeles prioritizes Chinese social, student, weekend and newcomer dinner formats.",
  },
  {
    slug: "vancouver",
    name: "温哥华",
    nameEn: "Vancouver",
    province: "不列颠哥伦比亚",
    provinceEn: "British Columbia",
    country: "加拿大",
    countryEn: "Canada",
    countryCode: "CA",
    intro: "温哥华饭局服务北美华人与加拿大新移民，覆盖列治文、本拿比、UBC 周边的中文生活圈。",
    introEn: "Vancouver dinners serve the North American Chinese community and Canadian newcomers, covering Mandarin-speaking circles around Richmond, Burnaby and UBC.",
    answer: "温哥华饭局优先开放新移民饭局、华人饭局、留学生饭局和周末饭局。",
    answerEn: "Vancouver prioritizes newcomer, Chinese social, student and weekend dinner formats.",
  },
  {
    slug: "toronto",
    name: "多伦多",
    nameEn: "Toronto",
    province: "安大略",
    provinceEn: "Ontario",
    country: "加拿大",
    countryEn: "Canada",
    countryCode: "CA",
    intro: "多伦多饭局覆盖 Downtown、North York、Markham 的华人圈，适合金融、科技、留学生与新移民。",
    introEn: "Toronto dinners cover the Chinese community in Downtown, North York and Markham — finance, tech, students and newcomers.",
    answer: "多伦多饭局优先开放新移民饭局、华人饭局、商务饭局和单身饭局。",
    answerEn: "Toronto prioritizes newcomer, Chinese social, business and singles dinner formats.",
  },
  {
    slug: "london",
    name: "伦敦",
    nameEn: "London",
    province: "大伦敦",
    provinceEn: "Greater London",
    country: "英国",
    countryEn: "United Kingdom",
    countryCode: "GB",
    intro: "伦敦饭局覆盖金融城、Canary Wharf、唐人街周边的华人圈，适合金融、咨询、留学生和创意工作者。",
    introEn: "London dinners cover the Chinese community around the City, Canary Wharf and Chinatown — finance, consulting, students and creative professionals.",
    answer: "伦敦饭局优先开放商务饭局、华人饭局、留学生饭局和高端饭局。",
    answerEn: "London prioritizes business, Chinese social, student and curated dinner formats.",
    highlights: ["金融城和 Canary Wharf 华人金融圈活跃，商务饭局需求旺盛。", "UCL、IC、LSE、KCL 等院校留学生适合优先报名留学生饭局。", "英伦华人社群跨城活跃，可联动曼彻斯特、爱丁堡等城市。"],
    highlightsEn: ["The Chinese finance community in the City and Canary Wharf drives strong demand for business dinners.", "International students from UCL, Imperial, LSE and KCL fit well with student dinners.", "The UK Chinese community is active across cities — good for links with Manchester and Edinburgh."],
  },
  {
    slug: "tokyo",
    name: "东京",
    nameEn: "Tokyo",
    province: "东京都",
    provinceEn: "Tokyo",
    country: "日本",
    countryEn: "Japan",
    countryCode: "JP",
    intro: "东京是海外华人、留学生和跨国企业从业者的重要聚集城市，饭局覆盖新宿、涩谷、池袋、六本木的华人圈，适合在日华人、留学生、日企/外企从业者和跨国创业者。东京华人社群活跃，中文语境的社交需求旺盛，华人饭局、留学生饭局和新移民饭局是优先开放类型。",
    introEn: "Tokyo is a major gathering city for overseas Chinese, international students and multinational professionals. Dinners cover the Chinese community in Shinjuku, Shibuya, Ikebukuro and Roppongi — suited for Chinese residents, students, Japanese/foreign company employees and cross-border founders. Tokyo's Chinese community is active, with strong demand for Mandarin-context socializing. Chinese social dining, student and newcomer dinners are the priority formats.",
    answer: "东京饭局优先开放华人饭局、留学生饭局、商务饭局和新移民饭局，适合在日华人、留学生、日企/外企从业者和跨国创业者报名。",
    answerEn: "Tokyo prioritizes Chinese social, student, business and newcomer dinner formats — open to Chinese residents, international students, Japanese/foreign company employees and cross-border founders.",
    highlights: ["新宿、涩谷、池袋、六本木是东京华人饭局的核心区域，中文语境社交需求旺盛。", "东京留学生和新移民多，留学生饭局和新移民饭局适合优先开放，帮助刚到东京的人建立社交圈。", "日企和外企华人从业者活跃，商务饭局和创业者饭局有较高需求，适合跨国职场社交。"],
    highlightsEn: ["Shinjuku, Shibuya, Ikebukuro and Roppongi are Tokyo's core Chinese dinner districts, with strong demand for Mandarin-context socializing.", "Tokyo has a large student and newcomer population — student and newcomer dinners are a priority, helping people who have just arrived build a social circle.", "Chinese professionals at Japanese and foreign companies are active — business and founder dinners are in demand, suited for cross-border professional networking."],
  },
  {
    slug: "sydney",
    name: "悉尼",
    nameEn: "Sydney",
    province: "新南威尔士",
    provinceEn: "New South Wales",
    country: "澳大利亚",
    countryEn: "Australia",
    countryCode: "AU",
    intro: "悉尼饭局覆盖 CBD、Chatswood、Burwood、Hurstville 的华人圈，适合金融、科技、留学生和新移民。",
    introEn: "Sydney dinners cover the Chinese community in the CBD, Chatswood, Burwood and Hurstville — finance, tech, students and newcomers.",
    answer: "悉尼饭局优先开放华人饭局、留学生饭局、新移民饭局和周末饭局。",
    answerEn: "Sydney prioritizes Chinese social, student, newcomer and weekend dinner formats.",
  },
  {
    slug: "melbourne",
    name: "墨尔本",
    nameEn: "Melbourne",
    province: "维多利亚",
    provinceEn: "Victoria",
    country: "澳大利亚",
    countryEn: "Australia",
    countryCode: "AU",
    intro: "墨尔本饭局覆盖 CBD、Box Hill、Glen Waverley 的华人圈，适合留学生、新移民和咖啡文化爱好者。",
    introEn: "Melbourne dinners cover the Chinese community in the CBD, Box Hill and Glen Waverley — suited for students, newcomers and café-culture enthusiasts.",
    answer: "墨尔本饭局优先开放华人饭局、留学生饭局、新移民饭局和周末饭局。",
    answerEn: "Melbourne prioritizes Chinese social, student, newcomer and weekend dinner formats.",
  },
  {
    slug: "singapore",
    name: "新加坡",
    nameEn: "Singapore",
    province: "新加坡",
    provinceEn: "Singapore",
    country: "新加坡",
    countryEn: "Singapore",
    countryCode: "SG",
    intro: "新加坡饭局覆盖 CBD、乌节、滨海湾周边的华语圈，适合金融、科技、管培生、创业者和华人新移民。",
    introEn: "Singapore dinners cover the Mandarin-speaking community around the CBD, Orchard and Marina Bay — suited for finance, tech, management trainees, founders and Chinese newcomers.",
    answer: "新加坡饭局优先开放商务饭局、华人饭局、新移民饭局和创业者饭局。",
    answerEn: "Singapore prioritizes business, Chinese social, newcomer and founder dinner formats.",
    highlights: ["CBD、乌节、滨海湾华人金融和科技圈密集，商务饭局需求旺盛。", "中国大陆新移民和华人创业者多，新移民饭局和创业者饭局适合优先开放。", "适合与香港、吉隆坡等区域华语城市联动。"],
    highlightsEn: ["CBD, Orchard and Marina Bay host a dense Chinese finance and tech community — strong demand for business dinners.", "Many mainland Chinese newcomers and founders — good fit for newcomer and founder dinners.", "Good for cross-city links with regional Mandarin-speaking cities like Hong Kong and Kuala Lumpur."],
  },
  {
    slug: "hong-kong",
    name: "香港",
    nameEn: "Hong Kong",
    province: "香港",
    provinceEn: "Hong Kong",
    country: "中国香港",
    countryEn: "Hong Kong SAR",
    countryCode: "HK",
    intro: "香港饭局覆盖中环、尖沙咀、铜锣湾的华语圈，适合金融、法律、港漂和大湾区跨城人群。",
    introEn: "Hong Kong dinners cover the Mandarin-speaking community in Central, Tsim Sha Tsui and Causeway Bay — finance, legal, mainland transplants and Greater Bay Area cross-city residents.",
    answer: "香港饭局优先开放商务饭局、华人饭局、单身饭局和高端饭局。",
    answerEn: "Hong Kong prioritizes business, Chinese social, singles and curated dinner formats.",
  },
  {
    slug: "taipei",
    name: "台北",
    nameEn: "Taipei",
    province: "台北",
    provinceEn: "Taipei",
    country: "中国台湾",
    countryEn: "Taiwan",
    countryCode: "TW",
    intro: "台北饭局覆盖信义、大安、中山的华语圈，适合内容、设计、餐饮、文化和跨海生活人群。",
    introEn: "Taipei dinners cover the Mandarin-speaking community in Xinyi, Da'an and Zhongshan — content, design, F&B, culture and cross-strait residents.",
    answer: "台北饭局优先开放华人饭局、单身饭局、周末饭局和高端饭局。",
    answerEn: "Taipei prioritizes Chinese social, singles, weekend and curated dinner formats.",
  },
]

export const categories: Category[] = [
  {
    slug: "singles-dinner",
    name: "单身饭局",
    nameEn: "Singles Dinner",
    audience: "单身用户、海归、新城市年轻人",
    audienceEn: "Single users, returnees, young newcomers to a city",
    intro: "单身饭局通过小桌晚餐降低尴尬感，适合希望自然认识异性和同频朋友的用户。",
    introEn: "Singles dinners use small-table settings to reduce awkwardness — ideal for people who want to naturally meet compatible people of the opposite sex.",
    answer: "单身饭局适合希望在线下晚餐中自然认识新朋友的人，饭局 Fanju 会优先做主办方审核和可信报名。",
    answerEn: "Singles dinners suit people who want to naturally meet new friends at in-person dinners. Fanju prioritizes host review and trusted RSVPs.",
    tips: ["选择年龄段和城市都匹配的场次，避免跨城或年龄差距过大的饭局。", "简介里说明职业和兴趣即可，不需要过度包装。", "把目标放在认识真实的人，而不是追求一次饭局立刻有结果。"],
    tipsEn: ["Choose sessions that match your age range and city — avoid cross-city or large age-gap dinners.", "In your profile, mention your profession and interests. No need to over-package yourself.", "Focus on meeting genuine people rather than expecting immediate results from a single dinner."],
  },
  {
    slug: "curated-dinner",
    name: "高端饭局",
    nameEn: "Curated Dinner",
    audience: "高质量社交、餐厅体验和城市生活方式用户",
    audienceEn: "Users who value quality social experiences, restaurant settings and urban lifestyle",
    intro: "高端饭局关注餐厅环境、主办方经验和参与者质量，不承诺结果，只提供更稳妥的晚餐社交入口。",
    introEn: "Curated dinners focus on venue quality, host experience and guest calibre — no outcome promises, just a more considered social dining entry point.",
    answer: "高端饭局适合重视餐厅体验和同桌质量的人，报名后通常由主办方根据主题、城市和资料审核。",
    answerEn: "Curated dinners suit people who care about venue quality and table fit. RSVPs are typically reviewed by hosts based on theme, city and profile.",
    tips: ["报名前确认菜单、人数上限、费用包含项和取消规则。", "不必只追求最贵场次，主题匹配和主办方经验更重要。", "避免被以稀缺席位为由要求提前高额付款的主办方。"],
    tipsEn: ["Before signing up, confirm the menu, guest cap, what is included in the cost and the cancellation policy.", "Don't chase the most expensive session — theme fit and host experience matter more.", "Be cautious of hosts who ask for large advance payments citing scarce seats."],
  },
  {
    slug: "business-dinner",
    name: "商务饭局",
    nameEn: "Business Dinner",
    audience: "创业者、投资人、管理者、专业服务人士",
    audienceEn: "Founders, investors, managers and professional service practitioners",
    intro: "商务饭局适合围绕行业、资源、合作和城市机会进行轻量交流。",
    introEn: "Business dinners are suited for light exchange around industry, resources, collaboration and city opportunities.",
    answer: "商务饭局不是融资承诺，而是帮助创业者、管理者和专业人士在晚餐场景中建立可信连接。",
    answerEn: "Business dinners are not a funding promise — they help founders, managers and professionals build trusted connections over dinner.",
    tips: ["简介中写清行业、角色和可交流资源，避免夸大公司阶段。", "准备一个简短自我介绍和两个可讨论问题。", "商业敏感信息不应在初次饭局中完整披露，涉及合作应后续正式确认。"],
    tipsEn: ["In your profile, state your industry, role and shareable resources. Avoid overstating your company stage.", "Prepare a brief self-introduction and two discussion questions.", "Do not fully disclose commercially sensitive information at a first dinner. Follow up formally for any collaboration."],
  },
  {
    slug: "founder-dinner",
    name: "创业者饭局",
    nameEn: "Founder Dinner",
    audience: "创始人、早期团队、投资与产业从业者",
    audienceEn: "Founders, early-stage teams, investors and industry practitioners",
    intro: "创业者饭局更适合聊行业判断、产品增长、组织管理和城市资源。",
    introEn: "Founder dinners are better suited for discussing industry views, product growth, team building and city resources.",
    answer: "创业者饭局适合创始人和早期团队报名，重点是交流经验与拓展同城同行关系。",
    answerEn: "Founder dinners suit founders and early-stage teams. The focus is sharing experience and expanding local peer relationships.",
    tips: ["说明你的行业方向、公司阶段和希望交流的资源或问题。", "饭局不承诺融资或合作结果，适合建立初步信任。", "涉及投资和顾问服务时，应在饭局之后再做正式尽调。"],
    tipsEn: ["State your industry focus, company stage and the resources or questions you want to discuss.", "Founder dinners do not promise funding or deal outcomes — they are for building initial trust.", "For investment or advisory discussions, conduct formal due diligence after the dinner."],
  },
  {
    slug: "weekend-dinner",
    name: "周末饭局",
    nameEn: "Weekend Dinner",
    audience: "周末有社交需求的城市年轻人",
    audienceEn: "Young urban professionals with social needs on weekends",
    intro: "周末饭局适合工作日较忙、希望在周五到周日安排轻松晚餐社交的用户。",
    introEn: "Weekend dinners suit busy weekday workers who want relaxed social dining from Friday to Sunday.",
    answer: "周末饭局适合想在周五、周六或周日认识同城新朋友的人，城市开放后会优先安排高需求场次。",
    answerEn: "Weekend dinners suit people who want to meet new local friends on Friday, Saturday or Sunday. High-demand sessions will be prioritized as cities open.",
    tips: ["提前确认饭局开始和结束时间，选择距离住处或交通枢纽更近的餐厅。", "周末饭局更适合轻松交流，可以围绕城市活动、餐厅和兴趣展开话题。", "周末夜间饭局结束后注意返程安全，避免临时参加来源不明的二场活动。"],
    tipsEn: ["Confirm the dinner start and end time in advance. Choose a restaurant close to your home or a transport hub.", "Weekend dinners suit relaxed conversation — city events, restaurants and interests are good topics.", "After a late weekend dinner, pay attention to your return journey safety. Avoid unplanned after-parties from unknown sources."],
  },
  {
    slug: "stranger-dinner",
    name: "陌生人饭局",
    nameEn: "Stranger Dinner",
    audience: "希望扩展弱关系和城市社交圈的人",
    audienceEn: "People looking to expand weak ties and their urban social circle",
    intro: "陌生人饭局强调安全、边界和主题引导，让不认识的人在晚餐中有自然交流入口。",
    introEn: "Stranger dinners emphasize safety, boundaries and theme guidance — giving people who don't know each other a natural entry point for conversation.",
    answer: "陌生人饭局适合想扩大社交圈的人，建议选择主题清晰、主办方信息明确的场次。",
    answerEn: "Stranger dinners suit people who want to expand their social circle. Choose sessions with a clear theme and transparent host information.",
    tips: ["选择主题清晰、主办方信息明确的场次，降低不确定性。", "首次见面保持边界，遇到不舒服的交流可以直接结束话题或联系主办方。", "不要提前向陌生人转账或透露敏感隐私。"],
    tipsEn: ["Choose sessions with a clear theme and transparent host information to reduce uncertainty.", "Maintain boundaries at a first meeting. Feel free to end uncomfortable conversations or contact the host.", "Do not transfer money in advance to strangers or share sensitive personal information."],
  },
  {
    slug: "chinese-social-dining",
    name: "华人饭局",
    nameEn: "Chinese Social Dining",
    audience: "中文用户、华人社群和跨城生活人群",
    audienceEn: "Mandarin speakers, Chinese communities and cross-city residents",
    intro: "华人饭局围绕中文语境、文化背景和城市生活展开，适合大陆城市和海外华人社群。",
    introEn: "Chinese social dining revolves around Mandarin context, cultural background and city life — suited for mainland cities and overseas Chinese communities.",
    answer: "华人饭局适合希望在中文语境里认识新朋友的人，中国大陆城市会优先开放。",
    answerEn: "Chinese social dining suits people who want to meet new friends in a Mandarin-speaking context. Mainland China cities will open first.",
    tips: ["适合希望在中文语境里认识新朋友的人，中国大陆城市会优先开放。", "报名时说明你的城市、职业和希望认识的人群。", "饭局不承诺固定社交结果，以真实交流为主。"],
    tipsEn: ["Suited for people who want to meet new friends in a Mandarin-speaking context. Mainland China cities open first.", "When signing up, mention your city, profession and the kind of people you hope to meet.", "Dinners do not promise fixed social outcomes — genuine conversation is the focus."],
  },
  {
    slug: "student-dinner",
    name: "留学生饭局",
    nameEn: "Student Dinner",
    audience: "留学生、海归、交换生和年轻校友",
    audienceEn: "International students, returnees, exchange students and young alumni",
    intro: "留学生饭局适合在求学、回国或跨城阶段寻找同频朋友、校友和城市信息的人。",
    introEn: "Student dinners suit people in study, return or cross-city phases looking for like-minded friends, alumni and city information.",
    answer: "留学生饭局适合留学生和海归报名，重点是安全、真实、低压力的晚餐交流。",
    answerEn: "Student dinners suit international students and returnees. The focus is safe, genuine, low-pressure dinner conversation.",
    tips: ["说明你的求学阶段、所在城市和希望了解的本地信息。", "重点是安全、真实、低压力的晚餐交流，不需要过度准备。", "首次见面建议选择公开餐厅，保留行程信息。"],
    tipsEn: ["Mention your study stage, current city and what local information you hope to learn.", "The focus is safe, genuine, low-pressure dinner conversation — no need to over-prepare.", "For a first meeting, choose a public restaurant and keep your itinerary information."],
  },
  {
    slug: "newcomer-dinner",
    name: "新移民饭局",
    nameEn: "Newcomer Dinner",
    audience: "新到一座城市工作、学习或生活的人",
    audienceEn: "People who have recently moved to a city for work, study or life",
    intro: "新移民饭局帮助刚到城市的人了解本地生活、认识同城朋友和建立基础社交圈。",
    introEn: "Newcomer dinners help people who have just arrived in a city understand local life, meet local friends and build a basic social circle.",
    answer: "新移民饭局适合刚到深圳、广州、上海、北京、杭州、成都等城市的人提前报名关注。",
    answerEn: "Newcomer dinners suit people who have recently arrived in Shenzhen, Guangzhou, Shanghai, Beijing, Hangzhou, Chengdu and other cities.",
    tips: ["说明你来到城市的时间、工作或学习状态和希望了解的本地信息。", "刚到城市时更应选择公开餐厅和明确主办方，避免参加信息不清楚的饭局。", "深圳、广州、上海、北京、杭州、成都等城市流动人口多，适合优先关注新移民饭局。"],
    tipsEn: ["Mention how long you have been in the city, your work or study situation and what local information you hope to learn.", "When new to a city, choose public restaurants and verified hosts. Avoid dinners where address, cost or guest info is unclear.", "Shenzhen, Guangzhou, Shanghai, Beijing, Hangzhou and Chengdu have large transient populations — good cities for newcomer dinners."],
  },
  {
    slug: "local-dinner",
    name: "同城饭局",
    nameEn: "Local Dinner",
    audience: "希望认识同城朋友、扩展本地社交圈的人",
    audienceEn: "People who want to meet locals and expand their city social circle",
    intro: "同城饭局帮助用户在自己所在的城市通过小桌晚餐认识新朋友，适合刚到城市或希望拓展本地人脉的人。",
    introEn: "Local dinners help users meet new people in their own city through small-table settings — ideal for newcomers or anyone looking to expand their local network.",
    answer: "同城饭局适合希望在本地认识同频朋友的人，饭局 Fanju 优先覆盖深圳、广州、上海、北京、杭州、成都等城市。",
    answerEn: "Local dinners suit people who want to meet like-minded locals. Fanju prioritizes Shenzhen, Guangzhou, Shanghai, Beijing, Hangzhou and Chengdu.",
    tips: ["选择距离住处或工作地点较近的场次，降低出行成本。", "同城饭局更适合轻松交流，不需要过度准备。", "优先选择主题清晰、主办方信息明确的场次。"],
    tipsEn: ["Choose a session close to your home or workplace to reduce travel time.", "Local dinners suit relaxed conversation — no need to over-prepare.", "Prioritize sessions with a clear theme and transparent host information."],
  },
  {
    slug: "high-quality-social-dining",
    name: "高质量社交饭局",
    nameEn: "High Quality Social Dining",
    audience: "重视同桌质量和真实交流的用户",
    audienceEn: "Users who value table quality and genuine conversation",
    intro: "高质量社交饭局强调可信报名、主办方审核和真实交流，适合不想浪费时间在低质量社交上的人。",
    introEn: "High quality social dining emphasizes trusted RSVPs, host review and genuine conversation — suited for people who don't want to waste time on low-quality socializing.",
    answer: "高质量社交饭局适合重视同桌质量和真实交流的人，报名通常需要主办方审核。",
    answerEn: "High quality social dining suits people who value table quality and genuine exchange. RSVPs typically require host review.",
    tips: ["报名时填写真实、具体的个人信息，有助于主办方匹配同频同桌。", "不要只看价格，主题匹配和主办方经验更重要。", "高质量社交的核心是真实表达，而不是过度包装。"],
    tipsEn: ["Fill in genuine, specific profile information to help hosts match compatible guests.", "Don't just look at price — theme fit and host experience matter more.", "The core of quality socializing is genuine expression, not over-packaging yourself."],
  },
  {
    slug: "dinner-buddy",
    name: "饭搭子",
    nameEn: "Dinner Buddy",
    audience: "希望找到固定饭搭子、共同探索本地餐厅的用户",
    audienceEn: "People looking for a regular dining companion to explore local restaurants together",
    intro: "饭搭子是一种轻社交形式，不强调恋爱或商务目的，只是找一个志同道合的人一起吃饭、聊天、探索城市餐厅。适合不想独自用餐、又不想参加大型聚会的人。",
    introEn: "A dinner buddy is a light social format — no dating or business agenda, just finding someone to share meals, conversation and local restaurant exploration with. Suited for people who don't want to eat alone but also don't want large group events.",
    answer: "饭搭子饭局适合希望找到固定饭友、共同探索本地餐厅的用户，以小桌、公开餐厅、真实报名为基础。",
    answerEn: "Dinner buddy dinners suit people looking for a regular dining companion. Built on small tables, public restaurants and verified RSVPs.",
    tips: ["选择主题明确的饭搭子饭局，更容易找到兴趣相近的同桌。", "第一次见面建议选择公开餐厅，保持轻松氛围。", "饭搭子不等于约会，明确目的有助于双方都更自在。"],
    tipsEn: ["Choose dinner buddy gatherings with a clear theme to find compatible companions more easily.", "For a first meeting, pick a public restaurant and keep the atmosphere relaxed.", "A dinner buddy is not a date — being clear about intent helps both sides feel comfortable."],
  },
]

export const questions: Question[] = [
  {
    slug: "what-is-fanju",
    title: "饭局 Fanju 是什么？",
    titleEn: "What is Fanju?",
    answer: "饭局 Fanju 是面向中文用户的高质量晚餐社交平台，优先覆盖中国大陆城市。它帮助用户通过小桌饭局认识同城同频的人，场次以招募中和即将开放城市为准。",
    answerEn: "Fanju is a quality social dining platform for Mandarin speakers, prioritizing mainland China cities. It helps users meet like-minded locals through small-table dinners. Sessions are subject to host recruitment and city opening schedules.",
    detail: ["饭局 Fanju 不展示虚假报名人数，也不承诺固定匹配结果。", "平台更适合作为线下社交入口，具体参与体验取决于城市、主题、主办方和同桌成员。"],
    detailEn: ["Fanju does not display inflated RSVP counts or promise fixed matching outcomes.", "The platform is best understood as an entry point for in-person socializing. The actual experience depends on city, theme, host and fellow guests."],
  },
  {
    slug: "how-to-join-dinner",
    title: "如何报名饭局？",
    titleEn: "How do I join a dinner?",
    answer: "报名饭局通常需要选择城市、饭局类型并提交基础资料。主办方会根据主题、城市和席位情况审核，开放城市优先覆盖深圳、广州、上海、北京、杭州、成都等地。",
    answerEn: "Joining a dinner typically requires selecting a city, dinner type and submitting a basic profile. Hosts review RSVPs based on theme, city and seat availability. Open cities prioritize Shenzhen, Guangzhou, Shanghai, Beijing, Hangzhou and Chengdu.",
    detail: ["建议填写真实但不过度暴露隐私的个人信息。", "如城市尚未开放，可以先关注主办方招募和候补报名。"],
    detailEn: ["Fill in genuine but not overly private personal information.", "If your city is not yet open, follow host recruitment updates and join the waitlist."],
  },
  {
    slug: "is-fanju-safe",
    title: "饭局 Fanju 安全吗？",
    titleEn: "Is Fanju safe?",
    answer: "饭局 Fanju 的安全重点是可信报名、主办方审核和线下边界提醒。平台不以夸张承诺替代安全判断，用户仍应选择公开餐厅、保留行程信息并遵守个人边界。",
    answerEn: "Fanju's safety focus is trusted RSVPs, host review and in-person boundary reminders. The platform does not replace personal safety judgment with exaggerated promises. Users should choose public restaurants, keep itinerary information and maintain personal boundaries.",
    detail: ["首次见面建议选择交通方便、营业稳定的餐厅。", "不要提前向陌生人转账或透露敏感证件、住址、财务信息。"],
    detailEn: ["For a first meeting, choose a restaurant that is easy to reach and reliably open.", "Do not transfer money in advance to strangers or share sensitive ID, address or financial information."],
  },
  {
    slug: "which-cities-open-first",
    title: "饭局 Fanju 哪些城市优先开放？",
    titleEn: "Which cities does Fanju open first?",
    answer: "饭局 Fanju 会优先覆盖中国大陆城市，尤其是深圳、广州、上海、北京、杭州、成都等城市。其他城市会根据报名需求、主办方资源和餐厅供给逐步开放。",
    answerEn: "Fanju prioritizes mainland China cities, especially Shenzhen, Guangzhou, Shanghai, Beijing, Hangzhou and Chengdu. Other cities will open gradually based on RSVP demand, host resources and venue supply.",
    detail: ["优先城市并不代表每天都有固定场次。", "城市页面会用于承接搜索需求和主办方招募。"],
    detailEn: ["Priority cities do not guarantee daily fixed sessions.", "City pages are used to capture search demand and recruit hosts."],
  },
  {
    slug: "singles-dinner-worth-it",
    title: "单身饭局适合脱单吗？",
    titleEn: "Are singles dinners good for dating?",
    answer: "单身饭局适合想自然认识异性的人，但不应被理解为保证脱单。它的价值在于提供低压力、可交流、有主题的小桌晚餐场景。",
    answerEn: "Singles dinners suit people who want to naturally meet someone, but should not be understood as a guarantee of dating outcomes. Their value lies in providing a low-pressure, conversational, themed small-table dinner setting.",
    detail: ["建议选择主题清晰、人数适中、主办方规则明确的饭局。", "把目标放在认识真实的人，而不是追求一次饭局立刻有结果。"],
    detailEn: ["Choose dinners with a clear theme, appropriate group size and transparent host rules.", "Focus on meeting genuine people rather than expecting immediate results from a single dinner."],
  },
  {
    slug: "business-dinner-vs-networking",
    title: "商务饭局和普通 networking 有什么区别？",
    titleEn: "How is a business dinner different from regular networking?",
    answer: "商务饭局比普通 networking 更轻松，通常围绕晚餐、行业主题和少量同桌成员展开。它适合建立初步信任，但不等于保证融资或保证合作。",
    answerEn: "Business dinners are more relaxed than typical networking events, usually centered around dinner, an industry theme and a small group of guests. They are suited for building initial trust, but do not guarantee funding or partnerships.",
    detail: ["饭局中更适合交换观点、经验和后续联系。", "涉及商业合作时，应在线下饭局之后再做正式尽调和书面确认。"],
    detailEn: ["Dinners are better for exchanging views, experience and follow-up contacts.", "For business collaboration, conduct formal due diligence and written confirmation after the dinner."],
  },
  {
    slug: "what-to-prepare-before-dinner",
    title: "参加饭局前要准备什么？",
    titleEn: "What should I prepare before attending a dinner?",
    answer: "参加饭局前建议确认餐厅、时间、费用、主办方规则和退款说明。也可以准备简短自我介绍、可聊话题和明确的个人边界。",
    answerEn: "Before attending a dinner, confirm the restaurant, time, cost, host rules and refund policy. You can also prepare a brief self-introduction, conversation topics and clear personal boundaries.",
    detail: ["不要空腹到场但也不要迟到，晚餐社交的第一印象很重要。", "如临时不能参加，应尽早通知主办方。"],
    detailEn: ["Don't arrive hungry but don't be late either — first impressions matter at social dinners.", "If you can't attend at the last minute, notify the host as early as possible."],
  },
  {
    slug: "does-fanju-show-real-counts",
    title: "饭局 Fanju 会展示真实报名人数吗？",
    titleEn: "Does Fanju show real RSVP counts?",
    answer: "饭局 Fanju 不展示虚假报名人数，也不使用夸张数字制造紧迫感。页面文案会以招募中、即将开放、主办方招募中等状态表达城市和品类进度。",
    answerEn: "Fanju does not display inflated RSVP counts or use exaggerated numbers to create urgency. Page copy uses statuses like recruiting, opening soon and host recruiting to communicate city and category progress.",
    detail: ["SEO 页面用于解释城市和饭局类型，不等同于实时席位列表。", "具体场次以产品内开放信息和主办方确认为准。"],
    detailEn: ["SEO pages explain cities and dinner types — they are not real-time seat listings.", "Specific sessions are subject to in-product open information and host confirmation."],
  },
]

export const guides: Guide[] = [
  {
    slug: "mainland-city-dinner-guide",
    title: "中国大陆城市饭局报名指南",
    titleEn: "Mainland China City Dinner Guide",
    answer: "中国大陆城市饭局适合想通过晚餐认识同城朋友、行业伙伴或新社交圈的人。优先关注深圳、广州、上海、北京、杭州、成都等城市，并选择主题清晰、主办方信息明确的场次。",
    answerEn: "Mainland China city dinners suit people who want to meet local friends, industry peers or a new social circle over dinner. Prioritize Shenzhen, Guangzhou, Shanghai, Beijing, Hangzhou and Chengdu, and choose sessions with a clear theme and transparent host information.",
    sections: [
      {
        title: "大陆城市饭局怎么选",
        body: "优先选择深圳、广州、上海、北京、杭州、成都等主办方资源较集中的城市。选择时看三点：主题是否清晰（单身、商务、周末还是陌生人饭局）、主办方信息是否公开（姓名、联系方式、过往场次）、餐厅是否是公开营业的正规餐厅。避免只有微信群、没有明确地址和费用说明的饭局。",
      },
      {
        title: "第一次报名看什么",
        body: "第一次报名饭局，重点确认四项：餐厅名称和地址（可以提前查地图）、饭局开始和结束时间、费用包含项和退款规则、主办方联系方式。资料填写以真实、简洁、可审核为原则，不需要过度包装，但职业和城市信息要准确。",
      },
      {
        title: "如何判断主办方是否可信",
        body: "可信的主办方通常具备：公开的个人或机构信息、明确的场次规则和费用说明、过往场次的真实反馈、不以稀缺席位为由要求提前高额付款。如果主办方只在微信群里发通知、没有公开餐厅地址、要求提前大额转账，建议谨慎。",
      },
      {
        title: "费用和退款要确认什么",
        body: "报名前确认：费用是否包含餐费、服务费和场地费；退款规则是提前多少小时可以取消；是否有最低人数要求；如果场次取消，退款流程是什么。不要只看总价，要看清楚包含什么、不包含什么。",
      },
      {
        title: "公开餐厅和安全边界",
        body: "所有饭局建议选择公开营业的餐厅，避免私人场所或地址不明确的场次。首次见面不建议单独转场，保留行程信息给信任的朋友或家人。遇到不舒服的交流可以直接结束话题或联系主办方。不要提前向陌生人转账或透露敏感证件、住址、财务信息。",
      },
      {
        title: "深圳饭局特点",
        body: "深圳饭局以科技、出海、创业和年轻白领为主要人群，南山、福田、罗湖是核心区域。适合单身饭局、商务饭局、创业者饭局和周末饭局。深圳流动人口多，新移民饭局需求旺盛，主办方招募优先覆盖这几类场次。",
      },
      {
        title: "上海饭局特点",
        body: "上海饭局面向金融、咨询、互联网、品牌、海归与创业者，静安、徐汇、黄浦是核心区域。高端饭局、商务饭局、创业者饭局和单身饭局是优先开放类型。上海海归和外企人群多，留学生饭局和高端饭局需求旺盛。",
      },
      {
        title: "北京饭局特点",
        body: "北京饭局覆盖科技、媒体、投资、文化、咨询与高校圈层，朝阳、海淀、东城是核心区域。适合商务饭局、创业者饭局、周末饭局和陌生人饭局。北京高校资源丰富，留学生饭局和创业者饭局需求较高。",
      },
      {
        title: "广州、杭州、成都饭局特点",
        body: "广州饭局重视真实交流，天河、珠江新城是核心区域，周末饭局和高端饭局需求较高。杭州饭局面向互联网、电商、内容和创业人群，西湖、滨江是核心区域。成都饭局重视松弛和城市生活方式，锦江、武侯是核心区域，陌生人饭局和周末饭局适合优先开放。",
      },
    ],
    sectionsEn: [
      { title: "How to choose a mainland city dinner", body: "Prioritize cities with concentrated host resources: Shenzhen, Guangzhou, Shanghai, Beijing, Hangzhou and Chengdu. Check three things: whether the theme is clear (singles, business, weekend or stranger dinner), whether host information is public (name, contact, past sessions), and whether the venue is a publicly operating restaurant. Avoid dinners that only exist in a WeChat group with no clear address or cost breakdown." },
      { title: "What to check when signing up for the first time", body: "For your first dinner, confirm four things: restaurant name and address (check on a map in advance), dinner start and end time, what is included in the cost and the refund policy, and the host's contact information. Fill in your profile with genuine, concise and verifiable information. Your profession and city should be accurate." },
      { title: "How to assess host credibility", body: "Credible hosts typically have: public personal or organizational information, clear session rules and cost breakdowns, genuine feedback from past sessions, and no requests for large advance payments citing scarce seats. If a host only communicates in a WeChat group, has no public restaurant address, or asks for large advance transfers, proceed with caution." },
      { title: "What to confirm about costs and refunds", body: "Before signing up, confirm: whether the cost includes food, service fees and venue fees; how far in advance you can cancel for a refund; whether there is a minimum guest count; and what the refund process is if the session is cancelled. Don't just look at the total price — understand what is and isn't included." },
      { title: "Public restaurants and safety boundaries", body: "All dinners should be held at publicly operating restaurants. Avoid private venues or sessions with unclear addresses. For a first meeting, avoid moving to a second venue alone. Keep your itinerary with a trusted friend or family member. Feel free to end uncomfortable conversations or contact the host. Do not transfer money in advance to strangers or share sensitive ID, address or financial information." },
      { title: "Shenzhen dinner profile", body: "Shenzhen dinners focus on tech, cross-border business, startups and young professionals. Nanshan, Futian and Luohu are the core districts. Singles, business, founder and weekend dinners are the priority formats. Shenzhen's large transient population drives strong demand for newcomer dinners." },
      { title: "Shanghai dinner profile", body: "Shanghai dinners target finance, consulting, internet, brand, returnees and founders. Jing'an, Xuhui and Huangpu are the core districts. Curated, business, founder and singles dinners are the priority formats. Shanghai's large returnee and foreign enterprise population drives demand for student and curated dinners." },
      { title: "Beijing dinner profile", body: "Beijing dinners cover tech, media, investment, culture, consulting and university circles. Chaoyang, Haidian and Dongcheng are the core districts. Business, founder, weekend and stranger dinners are well-suited. Beijing's rich university ecosystem drives demand for student and founder dinners." },
      { title: "Guangzhou, Hangzhou and Chengdu dinner profiles", body: "Guangzhou dinners value authentic local connection, with Tianhe and Pearl River New Town as core districts — weekend and curated dinners are in high demand. Hangzhou dinners target internet, e-commerce, content and startup professionals, with West Lake and Binjiang as core districts. Chengdu dinners value a relaxed pace and city lifestyle, with Jinjiang and Wuhou as core districts — stranger and weekend dinners are a good fit." },
    ],
  },
  {
    slug: "singles-dinner-guide",
    title: "单身饭局报名与聊天指南",
    titleEn: "Singles Dinner Guide",
    answer: "单身饭局适合想在线下自然认识异性的人，但它不是结果承诺。更好的参与方式是选择可信主办方、保持真实表达，并把目标放在认识合适的人。",
    answerEn: "Singles dinners suit people who want to naturally meet someone in person, but they are not a promise of outcomes. A better approach is to choose a trusted host, stay genuine and focus on meeting the right person rather than expecting immediate results.",
    sections: [
      { title: "报名建议", body: "选择年龄段、城市和主题都合适的场次，简介里说明职业、兴趣和希望认识的人群即可。" },
      { title: "安全提示", body: "首次见面不建议单独转场，保持边界，遇到不舒服的交流可以直接结束话题或联系主办方。" },
      { title: "聊天建议", body: "从城市生活、兴趣、工作节奏和近期体验聊起，比直接追问收入、感情史和隐私更合适。" },
    ],
    sectionsEn: [
      { title: "How to sign up", body: "Choose a session that fits your age range, city and theme. In your profile, mention your profession, interests and the kind of people you hope to meet." },
      { title: "Safety tips", body: "For a first meeting, avoid moving to a second venue alone. Maintain boundaries and feel free to end uncomfortable conversations or contact the host." },
      { title: "Conversation tips", body: "Start with city life, interests, work pace and recent experiences — more natural than asking directly about income, relationship history or personal details." },
    ],
  },
  {
    slug: "business-dinner-guide",
    title: "商务饭局参与指南",
    titleEn: "Business Dinner Guide",
    answer: "商务饭局适合创业者、管理者和专业人士在晚餐场景中建立初步信任。它不是融资或成交承诺，适合交流行业观点、资源需求和后续合作可能。",
    answerEn: "Business dinners suit founders, managers and professionals who want to build initial trust over dinner. They are not a promise of funding or deals — they are suited for exchanging industry views, resource needs and potential future collaboration.",
    sections: [
      { title: "报名建议", body: "简介中写清行业、角色、关注方向和可交流资源，避免夸大公司阶段或合作结果。" },
      { title: "安全提示", body: "商业敏感信息不应在初次饭局中完整披露，涉及合作、投资和顾问服务时应后续正式确认。" },
      { title: "交流建议", body: "准备一个简短自我介绍和两个可讨论问题，让同桌更容易理解你能提供什么、正在寻找什么。" },
    ],
    sectionsEn: [
      { title: "How to sign up", body: "In your profile, clearly state your industry, role, areas of interest and resources you can share. Avoid overstating your company stage or expected outcomes." },
      { title: "Safety tips", body: "Do not fully disclose commercially sensitive information at a first dinner. For collaboration, investment or advisory discussions, follow up with formal confirmation." },
      { title: "Conversation tips", body: "Prepare a brief self-introduction and two discussion questions so fellow guests can easily understand what you offer and what you are looking for." },
    ],
  },
  {
    slug: "weekend-dinner-guide",
    title: "周末饭局城市社交指南",
    titleEn: "Weekend Dinner Guide",
    answer: "周末饭局适合工作日忙、希望在周五到周日安排轻松社交的人。建议优先选择交通方便、主题明确、人数适中的场次。",
    answerEn: "Weekend dinners suit busy weekday workers who want relaxed social plans from Friday to Sunday. Prioritize sessions that are easy to reach, have a clear theme and an appropriate group size.",
    sections: [
      { title: "报名建议", body: "提前确认饭局开始和结束时间，选择距离住处或交通枢纽更近的餐厅。" },
      { title: "安全提示", body: "周末夜间饭局结束后注意返程安全，避免临时参加来源不明的二场活动。" },
      { title: "体验建议", body: "周末饭局更适合轻松交流，可以围绕城市活动、餐厅、旅行和兴趣展开话题。" },
    ],
    sectionsEn: [
      { title: "How to sign up", body: "Confirm the dinner start and end time in advance and choose a restaurant closer to your home or a transport hub." },
      { title: "Safety tips", body: "After a late weekend dinner, pay attention to your return journey safety. Avoid joining unplanned after-parties from unknown sources." },
      { title: "Experience tips", body: "Weekend dinners are better suited for relaxed conversation — topics like city events, restaurants, travel and interests work well." },
    ],
  },
  {
    slug: "newcomer-dinner-guide",
    title: "新城市饭局社交指南",
    titleEn: "Newcomer City Dinner Guide",
    answer: "新移民饭局适合刚到一座城市工作、学习或生活的人。通过小桌晚餐，可以更快了解本地生活、认识同城朋友并建立基础社交圈。",
    answerEn: "Newcomer dinners suit people who have recently moved to a city for work, study or life. Small-table dinners help you understand local life faster, meet local friends and build a basic social circle.",
    sections: [
      { title: "报名建议", body: "说明你来到城市的时间、工作或学习状态、兴趣和希望了解的本地信息。" },
      { title: "安全提示", body: "刚到城市时更应选择公开餐厅和明确主办方，避免参加地址、费用、成员信息不清楚的饭局。" },
      { title: "城市建议", body: "深圳、广州、上海、北京、杭州、成都等城市流动人口多，适合优先关注新移民饭局。" },
    ],
    sectionsEn: [
      { title: "How to sign up", body: "Mention how long you have been in the city, your work or study situation, interests and what local information you hope to learn." },
      { title: "Safety tips", body: "When you are new to a city, it is especially important to choose public restaurants and verified hosts. Avoid dinners where the address, cost or guest information is unclear." },
      { title: "City tips", body: "Shenzhen, Guangzhou, Shanghai, Beijing, Hangzhou and Chengdu have large transient populations — good cities to prioritize for newcomer dinners." },
    ],
  },
  {
    slug: "curated-dinner-guide",
    title: "高端饭局选择指南",
    titleEn: "Curated Dinner Guide",
    answer: "高端饭局应关注餐厅环境、主办方经验、主题匹配和费用透明，而不是夸张背书。选择前应确认菜单、人数、费用包含项和取消规则。",
    answerEn: "Curated dinners should be evaluated on venue quality, host experience, theme fit and transparent pricing — not exaggerated endorsements. Before signing up, confirm the menu, group size, what is included in the cost and the cancellation policy.",
    sections: [
      { title: "报名建议", body: "根据预算、餐厅类型、城市区域和同桌主题选择，不必只追求最贵场次。" },
      { title: "安全提示", body: "避免被不明身份主办方以稀缺席位、内部资源等理由要求提前高额付款。" },
      { title: "体验建议", body: "高端饭局更适合重视氛围和同桌质量的人，交流时保持礼貌、准时和边界感。" },
    ],
    sectionsEn: [
      { title: "How to sign up", body: "Choose based on budget, restaurant type, city area and table theme. You do not need to chase the most expensive session." },
      { title: "Safety tips", body: "Be cautious of unverified hosts who ask for large advance payments citing scarce seats or exclusive resources." },
      { title: "Experience tips", body: "Curated dinners suit people who value atmosphere and table quality. Be polite, punctual and maintain a sense of personal boundaries." },
    ],
  },
  {
    slug: "host-recruitment-guide",
    title: "饭局主办方招募指南",
    titleEn: "Host Recruitment Guide",
    answer: "饭局 Fanju 正在招募中国大陆城市主办方，优先考虑深圳、广州、上海、北京、杭州、成都等城市。合适的主办方应具备本地餐厅资源、活动组织经验和可信的社群运营能力。",
    answerEn: "Fanju is recruiting hosts in mainland China cities, prioritizing Shenzhen, Guangzhou, Shanghai, Beijing, Hangzhou and Chengdu. Suitable hosts should have local venue resources, event organization experience and credible community management skills.",
    sections: [
      { title: "报名建议", body: "主办方应准备城市、可覆盖餐厅、目标人群、过往活动经验和基本风控规则。" },
      { title: "安全提示", body: "主办方不应承诺脱单、融资、成交或固定收益，所有场次应明确费用、退款和参与规则。" },
      { title: "运营建议", body: "从小规模、主题清晰、复盘充分的饭局开始，比快速扩张更适合建立口碑。" },
    ],
    sectionsEn: [
      { title: "How to apply", body: "Hosts should prepare information on their city, available venues, target audience, past event experience and basic risk management rules." },
      { title: "Safety tips", body: "Hosts should not promise dating outcomes, funding, deals or fixed returns. All sessions should clearly state costs, refund policies and participation rules." },
      { title: "Operations tips", body: "Start with small-scale, clearly themed dinners with thorough post-event reviews. This builds reputation better than rapid expansion." },
    ],
  },
]



export const templates: Template[] = [
  {
    slug: "dinner-invite",
    title: "饭局邀请模板",
    titleEn: "Dinner Invite Template",
    description: "适合主办方发送给潜在参与者的饭局邀请文案模板。",
    body: "你好，我是 [姓名]，正在组织一场 [城市][饭局类型]，时间是 [日期] [时间]，地点是 [餐厅名称]，人数约 [N] 人。\n\n主题：[主题描述]\n费用：[费用说明]\n报名截止：[截止时间]\n\n如有兴趣，请回复确认或填写报名表。期待与你共进晚餐。",
  },
  {
    slug: "business-dinner-rsvp",
    title: "商务饭局报名确认模板",
    titleEn: "Business Dinner RSVP Template",
    description: "适合商务饭局主办方发送给已报名参与者的确认文案。",
    body: "你好，感谢报名 [城市] 商务饭局。\n\n时间：[日期] [时间]\n地点：[餐厅名称及地址]\n人数：约 [N] 人\n费用：[费用说明]\n\n请准时到场，如临时无法参加请提前告知。期待与你共进晚餐。",
  },
  {
    slug: "founder-dinner-checklist",
    title: "创业者饭局 Checklist",
    titleEn: "Founder Dinner Checklist",
    description: "参加创业者饭局前的准备清单，帮助主办方和参与者做好准备。",
    body: "参加前：\n- 确认餐厅地址和交通方式\n- 准备 30 秒自我介绍（公司、阶段、正在做的事）\n- 想好 1-2 个可以和同桌讨论的问题\n\n参加时：\n- 准时到场\n- 主动介绍自己\n- 商业敏感信息不在初次饭局中完整披露\n\n参加后：\n- 有兴趣深入交流的，饭局后单独联系\n- 涉及合作投资，后续正式确认",
  },
  {
    slug: "split-bill-message",
    title: "饭局 AA 分账话术模板",
    titleEn: "Split Bill Message Template",
    description: "饭局结束后发起 AA 分账的礼貌话术模板。",
    body: "今晚饭局很开心！\n\n本次人均费用约 [金额] 元，包含 [餐费/服务费/场地费]。\n\n请通过 [支付方式] 转账给 [收款人]，备注「[饭局名称]」。\n\n感谢大家参与，期待下次再聚！",
  },
  {
    slug: "first-dinner-introduction",
    title: "第一次饭局自我介绍模板",
    titleEn: "First Dinner Introduction Template",
    description: "第一次参加饭局时的自我介绍模板，简洁自然不尴尬。",
    body: "大家好，我是 [姓名]，来自 [城市]，目前在做 [职业/行业]。\n\n平时比较喜欢 [1-2 个兴趣爱好]，今天来这里主要是想认识一些 [希望认识的人群]。\n\n很高兴认识大家，期待今晚的交流！",
  },
]

export const questionPages: QuestionPage[] = [
  {
    slug: "how-to-find-dinner-buddies",
    title: "如何找饭搭子？",
    titleEn: "How to Find Dinner Buddies",
    answer: "找饭搭子最可靠的方式是通过有主办方审核的饭局平台，选择所在城市和感兴趣的饭局类型，提交真实资料后等待审核。",
    answerEn: "The most reliable way to find dinner buddies is through a dinner platform with host review. Choose your city and dinner type, submit a genuine profile and wait for review.",
    tips: ["选择有主办方信息和公开餐厅的场次", "简介填写真实职业和兴趣，不需要过度包装", "首次见面选择公开餐厅，保留行程信息"],
  },
  {
    slug: "is-social-dining-safe",
    title: "饭局社交安全吗？",
    titleEn: "Is Social Dining Safe?",
    answer: "通过可信平台参加饭局社交是相对安全的。关键是选择公开餐厅、确认主办方信息、不提前向陌生人转账。",
    answerEn: "Joining social dining through a trusted platform is relatively safe. The key is choosing public restaurants, verifying host information and not transferring money to strangers in advance.",
    tips: ["选择公开营业的餐厅，避免私人场所", "不提前向陌生人转账或透露敏感信息", "保留行程信息给信任的朋友或家人"],
  },
  {
    slug: "what-to-wear-to-a-fanju-dinner",
    title: "参加饭局应该怎么穿？",
    titleEn: "What to Wear to a Fanju Dinner",
    answer: "参加饭局的穿着以整洁、得体为原则，根据饭局类型调整。商务饭局偏正式，周末饭局和陌生人饭局更休闲。",
    answerEn: "Dress neatly and appropriately, adjusting for the dinner type. Business dinners lean formal; weekend and stranger dinners are more casual.",
    tips: ["商务饭局：商务休闲或正装", "周末饭局：整洁休闲即可", "高端饭局：确认餐厅风格后决定"],
  },
  {
    slug: "how-to-host-a-dinner-gathering",
    title: "如何组织一场饭局？",
    titleEn: "How to Host a Dinner Gathering",
    answer: "组织饭局需要确定城市、主题、餐厅、人数、费用和规则，提前招募参与者并做好审核和沟通。",
    answerEn: "Hosting a dinner requires deciding on city, theme, venue, guest count, cost and rules, then recruiting and reviewing participants in advance.",
    tips: ["选择交通方便、环境适合交流的餐厅", "提前说明费用包含项和取消规则", "控制人数在 4-10 人，小桌更容易产生真实对话"],
  },
  {
    slug: "how-to-split-the-bill",
    title: "饭局怎么 AA 分账？",
    titleEn: "How to Split the Bill at Dinner",
    answer: "饭局 AA 分账建议提前说明费用包含项，饭局结束后通过微信、支付宝等方式统一收款，备注饭局名称。",
    answerEn: "For dinner bill splitting, state what is included in the cost upfront. After the dinner, collect payment via WeChat Pay or Alipay with the dinner name as a note.",
    tips: ["报名前说明人均费用和包含项", "饭局结束后统一发起收款，避免当场尴尬", "如有人临时取消，提前说明退款规则"],
  },
  {
    slug: "what-to-say-at-founder-dinner",
    title: "创业者饭局聊什么？",
    titleEn: "What to Say at a Founder Dinner",
    answer: "创业者饭局适合聊行业判断、产品增长、组织管理和城市资源，避免过度推销或要求对方立刻做决定。",
    answerEn: "Founder dinners are suited for discussing industry views, product growth, team building and city resources. Avoid over-pitching or asking for immediate decisions.",
    tips: ["准备 30 秒自我介绍和 1-2 个可讨论问题", "聊行业判断和经验比聊融资需求更自然", "商业敏感信息不在初次饭局中完整披露"],
  },
]

export function getCity(slug: string) {
  return cities.find((city) => city.slug === slug)
}

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug)
}

export function getQuestion(slug: string) {
  return questions.find((question) => question.slug === slug)
}

export function getGuide(slug: string) {
  return guides.find((guide) => guide.slug === slug)
}
