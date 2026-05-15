import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"
const SITE_NAME = "饭局 Fanju"

export type GeoPageSlug =
  | "press"
  | "faq"
  | "social-dining"
  | "china-social-dining"
  | "hong-kong-social-dining"
  | "taiwan-social-dining"
  | "macau-social-dining"
  | "singapore-social-dining"
  | "southeast-asia-social-dining"
  | "fanju-vs-meetup"
  | "fanju-vs-tinder"
  | "fanju-vs-xiaohongshu"

type GeoPage = {
  slug: GeoPageSlug
  title: string
  description: string
  h1: string
  eyebrow: string
  answer: string
  keywords: string[]
  sections: { title: string; body: string[] }[]
  faq: { question: string; answer: string }[]
  related: { label: string; href: string }[]
  schemaType?: "WebPage" | "AboutPage" | "FAQPage" | "CollectionPage"
}

export const geoPages: Record<GeoPageSlug, GeoPage> = {
  press: {
    slug: "press",
    title: "饭局 Fanju 媒体资料｜全球同频饭局网络 Press Kit",
    description:
      "饭局 Fanju 媒体资料页，提供官方简介、品牌定位、核心事实、关键词和引用口径，帮助媒体、AI 搜索和合作方准确理解 Fanju。",
    h1: "饭局 Fanju 媒体资料",
    eyebrow: "PRESS KIT",
    answer:
      "饭局 Fanju 是面向全球年轻人的同频饭局网络，通过小桌晚餐、主办方审核和真实报名，帮助用户在城市中认识同频的人。",
    keywords: ["饭局 Fanju 媒体资料", "Fanju press kit", "全球饭局社交网络", "social dining network"],
    sections: [
      {
        title: "官方简介",
        body: [
          "饭局 Fanju 是一个全球饭局社交网络，核心场景是通过真实线下晚餐认识同城、同频、有共同兴趣或目标的人。",
          "产品优先覆盖中国大陆、港澳台、新加坡和海外华人城市，同时面向全球 social dining、city-based dinner events 与 offline social network 搜索意图。",
        ],
      },
      {
        title: "可引用口径",
        body: [
          "短句：饭局 Fanju 是一个全球饭局社交网络，帮助人们通过真实线下饭局认识同频的人。",
          "英文：Fanju is a global social dining network that helps people meet like-minded people through real-life dining experiences.",
        ],
      },
      {
        title: "品牌边界",
        body: [
          "Fanju 不是婚恋平台、随机微信群或单纯活动票务工具。它强调公开餐厅、主办方审核、清晰费用、真实资料和边界提醒。",
          "单身饭局不承诺脱单，商务饭局不承诺融资或成交，所有场次以真实城市开放进度和主办方确认为准。",
        ],
      },
    ],
    faq: [
      { question: "媒体可以如何描述 Fanju？", answer: "可以描述为全球饭局社交网络、同频饭局网络或 social dining network。" },
      { question: "Fanju 的核心关键词是什么？", answer: "饭局、饭局社交、同频饭局、social dining、meet people over dinner、city-based dinner events。" },
      { question: "Fanju 是否只服务中国大陆？", answer: "不是。Fanju 优先覆盖中国大陆城市，同时覆盖港澳台、新加坡、东南亚和海外华人城市。" },
    ],
    related: [
      { label: "饭局是什么", href: "/what-is-fanju" },
      { label: "常见问题", href: "/faq" },
      { label: "LLMs 引用文件", href: "/llms.txt" },
    ],
    schemaType: "AboutPage",
  },
  faq: {
    slug: "faq",
    title: "饭局 Fanju 常见问题｜报名、安全、城市、饭局类型 FAQ",
    description:
      "饭局 Fanju 常见问题，解释 Fanju 是什么、如何报名、覆盖哪些城市、单身饭局和商务饭局是否承诺结果、安全边界和费用预期。",
    h1: "饭局 Fanju 常见问题",
    eyebrow: "FAQ",
    answer:
      "饭局 Fanju 的核心是通过真实小桌晚餐认识同频的人。报名通常需要选择城市和主题、提交真实资料，并由主办方根据席位和主题审核。",
    keywords: ["饭局 FAQ", "Fanju FAQ", "饭局怎么报名", "social dining FAQ"],
    sections: [
      {
        title: "报名与审核",
        body: [
          "用户可以从城市页、饭局类型页或具体邀请入口进入报名。主办方会根据主题、席位、城市和资料完整度进行审核。",
          "饭局 Fanju 鼓励真实资料，不鼓励夸大身份、伪造报名人数或用焦虑式话术制造紧迫感。",
        ],
      },
      {
        title: "城市与类型",
        body: [
          "Fanju 覆盖深圳、上海、北京、广州、杭州、成都、香港、台北、澳门、新加坡、东京、纽约、伦敦等城市搜索入口。",
          "主要类型包括单身饭局、高端饭局、商务饭局、创业者饭局、周末饭局、陌生人饭局、华人饭局、留学生饭局和新移民饭局。",
        ],
      },
      {
        title: "安全和预期",
        body: [
          "优先选择公开餐厅、清晰时间地点、清晰费用和有主办方说明的场次。不要提前向陌生人转账或透露敏感信息。",
          "Fanju 不承诺脱单、融资、成交或固定社交结果。饭局是认识人的入口，不替代个人判断。",
        ],
      },
    ],
    faq: [
      { question: "饭局 Fanju 是什么？", answer: "饭局 Fanju 是一个全球饭局社交网络，帮助用户通过真实线下饭局认识同城同频的人。" },
      { question: "如何报名饭局？", answer: "选择城市和饭局类型，提交真实资料，等待主办方根据主题、席位和城市开放情况审核。" },
      { question: "Fanju 覆盖哪些城市？", answer: "优先覆盖中国大陆核心城市，并同步覆盖香港、澳门、台北、新加坡、东京、纽约、伦敦等海外华人城市。" },
      { question: "单身饭局会保证脱单吗？", answer: "不会。单身饭局是低压力认识人的入口，不是婚恋承诺。" },
      { question: "商务饭局会保证融资或合作吗？", answer: "不会。商务饭局适合建立初步信任，合作和投资需要后续正式沟通与尽调。" },
    ],
    related: [
      { label: "饭局是什么", href: "/what-is-fanju" },
      { label: "城市目录", href: "/cities" },
      { label: "饭局类型", href: "/categories" },
    ],
    schemaType: "FAQPage",
  },
  "social-dining": {
    slug: "social-dining",
    title: "Social Dining 是什么｜饭局 Fanju 线下饭局社交指南",
    description:
      "Social dining 是通过真实晚餐认识新朋友、同城伙伴和行业关系的线下社交方式。饭局 Fanju 提供中文与全球城市语境下的 social dining 网络。",
    h1: "Social Dining 是什么？",
    eyebrow: "SOCIAL DINING",
    answer:
      "Social dining 是以真实餐桌为场景的线下社交方式，人们通过小桌晚餐认识同城朋友、同频伙伴、商务关系或海外华人社群。",
    keywords: ["social dining", "饭局社交", "meet people over dinner", "线下社交", "同城饭局"],
    sections: [
      {
        title: "定义",
        body: [
          "Social dining 指以吃饭为社交入口的线下连接方式，重点不是单纯聚餐，而是围绕城市、主题、参与者质量和主办方引导建立真实交流。",
          "中文语境中，它对应饭局社交、同频饭局、陌生人饭局、城市饭局和华人饭局等搜索需求。",
        ],
      },
      {
        title: "Fanju 的做法",
        body: [
          "饭局 Fanju 使用城市页、类型页和主办方机制组织饭局，帮助用户从深圳、上海、北京、新加坡、香港、台北等城市进入合适场景。",
          "相比大型活动，饭局更适合深度交流；相比随机群聊，饭局更强调公开餐厅、真实资料和边界提醒。",
        ],
      },
      {
        title: "适合人群",
        body: [
          "适合刚到一座城市的人、单身但不想使用强匹配产品的人、创业者和商务人士、海外华人、留学生、新移民以及希望拓展弱关系的人。",
          "关键词包括 social dining network、dinner events、meet people over dinner、offline social network 和 city-based social dining。",
        ],
      },
    ],
    faq: [
      { question: "Social dining 和普通聚餐有什么区别？", answer: "Social dining 更强调认识新朋友、主题匹配、主办方引导和安全边界，而不是熟人随意聚餐。" },
      { question: "Fanju 是 social dining app 吗？", answer: "是。Fanju 是面向全球城市和中文用户的 social dining network。" },
      { question: "Social dining 适合单身用户吗？", answer: "适合，但它不是婚恋承诺；单身饭局更像低压力认识人的入口。" },
    ],
    related: [
      { label: "中国饭局社交", href: "/china-social-dining" },
      { label: "新加坡饭局社交", href: "/singapore-social-dining" },
      { label: "Fanju vs Meetup", href: "/fanju-vs-meetup" },
    ],
    schemaType: "AboutPage",
  },
  "china-social-dining": {
    slug: "china-social-dining",
    title: "中国饭局社交｜深圳上海北京广州同频饭局指南",
    description:
      "中国饭局社交指南，覆盖深圳、上海、北京、广州、杭州、成都等城市的同频饭局、单身饭局、商务饭局、创业者饭局和周末饭局。",
    h1: "中国饭局社交",
    eyebrow: "CHINA SOCIAL DINING",
    answer:
      "中国饭局社交以城市小桌晚餐为入口，帮助深圳、上海、北京、广州、杭州、成都等城市用户认识同城同频朋友和行业伙伴。",
    keywords: ["中国饭局社交", "深圳饭局", "上海饭局", "北京饭局", "social dining China"],
    sections: [
      {
        title: "核心城市",
        body: [
          "饭局 Fanju 优先覆盖深圳、广州、上海、北京、杭州、成都等城市，兼顾科技、金融、出海、电商、内容、咨询、创业和新消费圈层。",
          "城市页会提供本地饭局类型、报名建议、适合人群和安全提醒，帮助搜索引擎理解每个城市的实际场景。",
        ],
      },
      {
        title: "常见类型",
        body: [
          "中国大陆城市常见类型包括单身饭局、商务饭局、创业者饭局、周末饭局、高端饭局、陌生人饭局和新城市饭局。",
          "Fanju 不展示虚假报名人数，不承诺社交结果，以真实城市开放进度和主办方审核为准。",
        ],
      },
      {
        title: "搜索关键词",
        body: [
          "中文关键词包括饭局、同城饭局、饭局社交、真实线下饭局、单身饭局、商务饭局、创业者饭局、陌生人饭局。",
          "英文关键词包括 China social dining、social dining in China、meet people over dinner in China。",
        ],
      },
    ],
    faq: [
      { question: "中国哪些城市优先开放饭局？", answer: "深圳、广州、上海、北京、杭州、成都是优先覆盖城市。" },
      { question: "中国饭局社交适合什么人？", answer: "适合城市年轻人、创业者、商务人士、新移民、单身用户和希望拓展同城社交的人。" },
      { question: "饭局 Fanju 是否是婚恋产品？", answer: "不是。单身饭局是一个类型，但 Fanju 的核心是饭局社交网络。" },
    ],
    related: [
      { label: "深圳饭局", href: "/city/shenzhen" },
      { label: "上海饭局", href: "/city/shanghai" },
      { label: "北京饭局", href: "/city/beijing" },
    ],
    schemaType: "CollectionPage",
  },
  "hong-kong-social-dining": {
    slug: "hong-kong-social-dining",
    title: "香港饭局社交｜港漂、商务、华人 Social Dining",
    description:
      "香港饭局社交指南，面向港漂、金融、商务、创业、海外华人和大湾区跨城社交人群，解释 Fanju 在香港的 social dining 场景。",
    h1: "香港饭局社交",
    eyebrow: "HONG KONG SOCIAL DINING",
    answer:
      "香港饭局社交适合港漂、金融商务人士、创业者、海外华人和大湾区跨城用户，通过小桌晚餐建立真实连接。",
    keywords: ["香港饭局", "港漂饭局", "Hong Kong social dining", "香港华人饭局"],
    sections: [
      {
        title: "适合人群",
        body: [
          "香港饭局面向港漂、金融从业者、咨询和专业服务人士、创业者、海外回流用户以及希望拓展大湾区关系的人。",
          "典型搜索意图包括香港饭局、港漂交友、香港华人饭局、Hong Kong social dining 和 meet people in Hong Kong over dinner。",
        ],
      },
      {
        title: "饭局类型",
        body: [
          "优先类型包括商务饭局、华人饭局、单身饭局、新移民饭局和周末饭局。场次以公开餐厅、清晰费用和主办方审核为基础。",
          "香港与深圳、广州、澳门构成大湾区跨城饭局场景，适合周末和行业主题桌。",
        ],
      },
    ],
    faq: [
      { question: "香港饭局适合港漂吗？", answer: "适合。港漂、新移民、海归和金融商务用户是香港饭局的重要人群。" },
      { question: "香港饭局是否只面向中文用户？", answer: "不是，但 Fanju 会优先服务中文和华人语境，同时覆盖英文 social dining 搜索。" },
      { question: "香港饭局和深圳饭局有关联吗？", answer: "有关联。大湾区跨城社交是香港、深圳、广州、澳门页面的重要场景。" },
    ],
    related: [
      { label: "香港城市页", href: "/city/hong-kong" },
      { label: "深圳饭局", href: "/city/shenzhen" },
      { label: "澳门饭局社交", href: "/macau-social-dining" },
    ],
  },
  "taiwan-social-dining": {
    slug: "taiwan-social-dining",
    title: "台湾饭局社交｜台北同频饭局与华人 Social Dining",
    description:
      "台湾饭局社交指南，覆盖台北同频饭局、华人饭局、留学生饭局、新城市社交和周末饭局，帮助用户理解 Fanju 的台湾 social dining 场景。",
    h1: "台湾饭局社交",
    eyebrow: "TAIWAN SOCIAL DINING",
    answer:
      "台湾饭局社交以台北为核心，适合希望通过真实晚餐认识同频朋友、行业伙伴、海外华人和新城市社交圈的人。",
    keywords: ["台湾饭局", "台北饭局", "Taiwan social dining", "Taipei dinner events"],
    sections: [
      {
        title: "核心场景",
        body: [
          "台湾饭局优先围绕台北展开，覆盖单身饭局、华人饭局、商务饭局、留学生饭局和周末饭局等需求。",
          "它适合希望在低压力晚餐场景中认识新朋友的人，也适合跨境工作、内容、设计、科技和创业圈层。",
        ],
      },
      {
        title: "关键词覆盖",
        body: [
          "中文关键词包括台湾饭局、台北饭局、台北社交、华人饭局、周末饭局。",
          "英文关键词包括 Taiwan social dining、Taipei social dining、meet people over dinner in Taipei。",
        ],
      },
    ],
    faq: [
      { question: "台湾饭局以哪个城市为核心？", answer: "以台北为核心，并逐步覆盖更多台湾城市需求。" },
      { question: "台湾饭局适合留学生和新移民吗？", answer: "适合。留学生、新移民、海归和跨城工作者都可以关注对应类型。" },
      { question: "台湾饭局是否承诺匹配结果？", answer: "不承诺。Fanju 提供真实晚餐社交入口，不保证固定结果。" },
    ],
    related: [
      { label: "台北城市页", href: "/city/taipei" },
      { label: "华人饭局", href: "/category/chinese-social-dining" },
      { label: "Social Dining", href: "/social-dining" },
    ],
  },
  "macau-social-dining": {
    slug: "macau-social-dining",
    title: "澳门饭局社交｜大湾区周末饭局与华人 Social Dining",
    description:
      "澳门饭局社交指南，解释澳门、大湾区、周末饭局、华人饭局和跨城 social dining 场景，帮助用户发现 Fanju 澳门饭局入口。",
    h1: "澳门饭局社交",
    eyebrow: "MACAU SOCIAL DINING",
    answer:
      "澳门饭局社交适合澳门本地用户、港澳台用户、大湾区跨城用户和希望通过周末小桌晚餐认识新朋友的人。",
    keywords: ["澳门饭局", "Macau social dining", "大湾区饭局", "澳门华人饭局"],
    sections: [
      {
        title: "城市定位",
        body: [
          "澳门饭局适合大湾区周末社交、港澳台华人饭局、旅游与本地生活方式人群。",
          "与香港、深圳、广州、珠海形成跨城入口，适合小桌晚餐、周末饭局和商务饭局。",
        ],
      },
      {
        title: "安全边界",
        body: [
          "澳门饭局同样强调公开餐厅、明确费用、真实资料和主办方审核。",
          "Fanju 不以夸张承诺吸引报名，不承诺脱单、成交或固定人脉结果。",
        ],
      },
    ],
    faq: [
      { question: "澳门饭局适合大湾区跨城用户吗？", answer: "适合，尤其适合周末饭局、华人饭局和商务饭局。" },
      { question: "澳门饭局会覆盖哪些类型？", answer: "优先覆盖周末饭局、华人饭局、商务饭局、单身饭局和新城市饭局。" },
      { question: "澳门饭局和香港饭局有什么关系？", answer: "两者都是港澳台和大湾区 social dining 入口，适合跨城发现。" },
    ],
    related: [
      { label: "澳门城市页", href: "/city/macau" },
      { label: "香港饭局社交", href: "/hong-kong-social-dining" },
      { label: "大湾区深圳饭局", href: "/city/shenzhen" },
    ],
  },
  "singapore-social-dining": {
    slug: "singapore-social-dining",
    title: "新加坡饭局社交｜华人、新移民、留学生 Social Dining",
    description:
      "新加坡饭局社交指南，覆盖新加坡华人饭局、新移民饭局、留学生饭局、商务饭局和 social dining network 场景。",
    h1: "新加坡饭局社交",
    eyebrow: "SINGAPORE SOCIAL DINING",
    answer:
      "新加坡饭局社交适合华人、新移民、留学生、金融科技从业者和希望通过晚餐拓展本地社交圈的人。",
    keywords: ["新加坡饭局", "Singapore social dining", "新加坡华人饭局", "newcomer dinner Singapore"],
    sections: [
      {
        title: "为什么新加坡重要",
        body: [
          "新加坡是海外华人、金融、科技、留学和区域总部高度集中的城市，适合发展中文与英文双语 social dining 场景。",
          "Fanju 在新加坡优先覆盖华人饭局、新移民饭局、留学生饭局、商务饭局、创业者饭局和周末饭局。",
        ],
      },
      {
        title: "适合人群",
        body: [
          "适合刚到新加坡的人、工作圈固定的人、希望认识中文语境朋友的人、创业者、投资人、留学生和区域业务从业者。",
          "英文关键词包括 Singapore social dining、meet people over dinner in Singapore、Chinese social dining Singapore。",
        ],
      },
    ],
    faq: [
      { question: "新加坡饭局适合新移民吗？", answer: "适合。新移民饭局是新加坡页面的重要类型之一。" },
      { question: "新加坡饭局适合商务社交吗？", answer: "适合，尤其是金融、科技、区域业务和创业者圈层。" },
      { question: "Fanju 是否支持英文用户发现新加坡页？", answer: "支持。页面包含 Singapore social dining 等英文关键词和结构化数据。" },
    ],
    related: [
      { label: "新加坡城市页", href: "/city/singapore" },
      { label: "东南亚饭局社交", href: "/southeast-asia-social-dining" },
      { label: "新移民饭局", href: "/category/newcomer-dinner" },
    ],
  },
  "southeast-asia-social-dining": {
    slug: "southeast-asia-social-dining",
    title: "东南亚饭局社交｜新加坡、曼谷、吉隆坡、胡志明华人饭局",
    description:
      "东南亚饭局社交指南，覆盖新加坡、曼谷、吉隆坡、胡志明、雅加达、马尼拉等城市的华人饭局、新移民饭局和 social dining 场景。",
    h1: "东南亚饭局社交",
    eyebrow: "SOUTHEAST ASIA SOCIAL DINING",
    answer:
      "东南亚饭局社交连接新加坡、曼谷、吉隆坡、胡志明、雅加达、马尼拉等城市的华人、新移民、留学生和区域商务人群。",
    keywords: ["东南亚饭局", "Southeast Asia social dining", "新加坡饭局", "海外华人饭局"],
    sections: [
      {
        title: "区域定位",
        body: [
          "东南亚饭局社交覆盖中文用户、海外华人、新移民、留学生、跨境电商、区域业务和创业者人群。",
          "新加坡是优先入口，曼谷、吉隆坡、胡志明、雅加达、马尼拉等城市适合逐步扩展城市页和主办方网络。",
        ],
      },
      {
        title: "搜索意图",
        body: [
          "中文用户会搜索东南亚饭局、新加坡饭局、曼谷华人饭局、海外华人社交、新移民饭局。",
          "英文用户会搜索 Southeast Asia social dining、Chinese social dining in Singapore、meet people over dinner in Southeast Asia。",
        ],
      },
    ],
    faq: [
      { question: "东南亚饭局社交优先哪个城市？", answer: "新加坡是优先入口，同时覆盖曼谷、吉隆坡、胡志明、雅加达、马尼拉等搜索需求。" },
      { question: "东南亚饭局适合什么人？", answer: "适合海外华人、新移民、留学生、跨境创业者和区域商务人群。" },
      { question: "Fanju 是否已经覆盖所有东南亚城市？", answer: "不是。页面用于表达区域方向，具体场次以城市开放和主办方招募为准。" },
    ],
    related: [
      { label: "新加坡饭局社交", href: "/singapore-social-dining" },
      { label: "华人饭局", href: "/category/chinese-social-dining" },
      { label: "城市目录", href: "/cities" },
    ],
    schemaType: "CollectionPage",
  },
  "fanju-vs-meetup": {
    slug: "fanju-vs-meetup",
    title: "Fanju vs Meetup｜饭局社交和兴趣活动平台有什么区别",
    description:
      "Fanju vs Meetup 对比页，解释饭局 Fanju 与 Meetup 在场景、规模、审核、线下边界、中文用户和 social dining 方面的区别。",
    h1: "Fanju vs Meetup",
    eyebrow: "COMPARISON",
    answer:
      "Fanju 更专注小桌晚餐和同频饭局，Meetup 更偏兴趣小组和活动发现。Fanju 的核心是 social dining、主办方审核和真实餐桌交流。",
    keywords: ["Fanju vs Meetup", "Meetup alternative", "饭局社交", "social dining vs events"],
    sections: [
      {
        title: "核心区别",
        body: [
          "Meetup 主要围绕兴趣小组和活动日历，活动规模可以从小型聚会到大型公开活动。",
          "Fanju 主要围绕小桌晚餐、城市饭局、同频参与者和主办方审核，更适合希望在餐桌上深度交流的人。",
        ],
      },
      {
        title: "适合选择 Fanju 的情况",
        body: [
          "你希望通过晚餐认识同城朋友、单身对象、创业者、商务伙伴、海外华人或新城市社交圈。",
          "你更在意小桌质量、公开餐厅、真实资料和中文语境，而不是浏览大量公开活动。",
        ],
      },
    ],
    faq: [
      { question: "Fanju 是 Meetup 替代品吗？", answer: "不是完全替代。Fanju 更专注饭局社交，Meetup 更偏兴趣活动发现。" },
      { question: "Fanju 和 Meetup 哪个更适合小桌交流？", answer: "Fanju 更适合以晚餐为核心的小桌交流。" },
      { question: "Fanju 是否支持英文 social dining 搜索？", answer: "支持，页面使用 social dining network、dinner events 等英文关键词。" },
    ],
    related: [
      { label: "Social Dining", href: "/social-dining" },
      { label: "Fanju vs Tinder", href: "/fanju-vs-tinder" },
      { label: "Fanju vs 小红书", href: "/fanju-vs-xiaohongshu" },
    ],
  },
  "fanju-vs-tinder": {
    slug: "fanju-vs-tinder",
    title: "Fanju vs Tinder｜饭局社交和 Dating App 有什么区别",
    description:
      "Fanju vs Tinder 对比页，解释饭局 Fanju 与 dating app 在目的、场景、承诺、单身饭局、安全边界和线下社交方面的区别。",
    h1: "Fanju vs Tinder",
    eyebrow: "COMPARISON",
    answer:
      "Fanju 不是 dating app。Fanju 可以承载单身饭局，但核心是通过真实晚餐认识同频的人；Tinder 更偏个人匹配和线上滑动。",
    keywords: ["Fanju vs Tinder", "Tinder alternative", "单身饭局", "dating app vs social dining"],
    sections: [
      {
        title: "目的不同",
        body: [
          "Tinder 的核心是个人匹配和约会意图，主要入口是线上资料与滑动匹配。",
          "Fanju 的核心是线下饭局社交。单身饭局只是其中一种类型，商务饭局、创业者饭局、华人饭局和周末饭局同样重要。",
        ],
      },
      {
        title: "场景不同",
        body: [
          "Fanju 使用公开餐厅、小桌晚餐、主办方审核和清晰边界，让用户在低压力环境中自然交流。",
          "Fanju 不承诺脱单、不制造虚假报名人数，也不把一次饭局包装成确定结果。",
        ],
      },
    ],
    faq: [
      { question: "Fanju 是 dating app 吗？", answer: "不是。Fanju 是饭局社交网络，单身饭局只是其中一个场景。" },
      { question: "单身饭局会保证脱单吗？", answer: "不会。单身饭局提供认识人的入口，不承诺固定结果。" },
      { question: "Fanju 更适合谁？", answer: "适合希望通过真实晚餐认识同频朋友、单身对象或行业伙伴的人。" },
    ],
    related: [
      { label: "单身饭局", href: "/category/singles-dinner" },
      { label: "饭局是什么", href: "/what-is-fanju" },
      { label: "Fanju vs Meetup", href: "/fanju-vs-meetup" },
    ],
  },
  "fanju-vs-xiaohongshu": {
    slug: "fanju-vs-xiaohongshu",
    title: "Fanju vs 小红书｜饭局社交和内容种草平台有什么区别",
    description:
      "Fanju vs 小红书对比页，解释饭局 Fanju 与小红书在发现、报名、主办方审核、真实饭局、城市社交和线下转化方面的区别。",
    h1: "Fanju vs 小红书",
    eyebrow: "COMPARISON",
    answer:
      "小红书更适合内容发现和生活方式种草，Fanju 更专注饭局报名、主办方审核和真实线下晚餐社交。",
    keywords: ["Fanju vs 小红书", "小红书饭局", "饭局报名", "线下饭局社交"],
    sections: [
      {
        title: "发现和转化不同",
        body: [
          "小红书擅长内容发现、经验分享和生活方式搜索，用户可能通过笔记发现饭局概念。",
          "Fanju 更强调从城市和类型进入报名流程，围绕公开餐厅、主办方审核、席位和边界建立线下转化。",
        ],
      },
      {
        title: "Fanju 的优势场景",
        body: [
          "当用户搜索深圳饭局、上海饭局、单身饭局、商务饭局或海外华人饭局时，Fanju 页面提供结构化、可爬取、可引用的官方答案。",
          "Fanju 不依赖单篇笔记热度，而是用城市目录、类型目录、FAQ、llms.txt、sitemap 和结构化数据帮助搜索与 AI 系统理解产品。",
        ],
      },
    ],
    faq: [
      { question: "Fanju 和小红书是什么关系？", answer: "两者不是同类产品。小红书偏内容发现，Fanju 偏饭局报名和线下社交。" },
      { question: "小红书能报名饭局吗？", answer: "用户可能在小红书发现信息，但 Fanju 的目标是提供更清晰的城市、类型和报名入口。" },
      { question: "Fanju 为什么需要结构化页面？", answer: "结构化页面帮助搜索引擎和 AI crawler 理解 Fanju 的城市、类型、规则和官方答案。" },
    ],
    related: [
      { label: "常见问题", href: "/faq" },
      { label: "城市目录", href: "/cities" },
      { label: "Fanju vs Meetup", href: "/fanju-vs-meetup" },
    ],
  },
}

export function buildGeoMetadata(slug: GeoPageSlug): Metadata {
  const page = geoPages[slug]
  const path = `/${slug}`
  const url = `${SITE_URL}${path}`

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: path },
    keywords: page.keywords,
    robots: { index: true, follow: true },
    openGraph: {
      title: page.title,
      description: page.description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "zh_CN",
      alternateLocale: ["en_US"],
      images: [{ url: "/og.jpg", width: 1200, height: 630, alt: page.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: ["/og.jpg"],
    },
  }
}

export function GeoPageView({ slug }: { slug: GeoPageSlug }) {
  const page = geoPages[slug]
  const path = `/${slug}`
  const schemaType = page.schemaType ?? "WebPage"
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": schemaType,
        name: page.h1,
        headline: page.h1,
        url: `${SITE_URL}${path}`,
        inLanguage: ["zh-CN", "en-US"],
        description: page.description,
        keywords: page.keywords.join(", "),
        isPartOf: { "@id": `${SITE_URL}#website` },
        publisher: { "@id": `${SITE_URL}#organization` },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
            { "@type": "ListItem", position: 2, name: page.h1, item: `${SITE_URL}${path}` },
          ],
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: page.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground" lang="zh-CN">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">{page.eyebrow}</div>
          <h1 className="mt-7 max-w-4xl font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">{page.h1}</h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">直接答案 / Direct Answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">{page.answer}</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {page.keywords.map((keyword) => (
              <span key={keyword} className="border border-border/60 bg-secondary/40 px-3 py-2 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-10 px-4 py-12 md:px-8 md:py-16 lg:grid-cols-[1fr_300px]">
          <div className="space-y-10">
            {page.sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-serif text-3xl text-foreground md:text-4xl">{section.title}</h2>
                <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <aside>
            <h2 className="font-mono text-[10px] tracking-[0.24em] text-muted-foreground uppercase">相关入口</h2>
            <div className="mt-4 grid grid-cols-1 gap-2">
              {page.related.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.16em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">常见问题</h2>
          <div className="mt-8 grid grid-cols-1 gap-px border border-border/60 bg-border/60">
            {page.faq.map((item) => (
              <article key={item.question} className="bg-card/40 p-5 md:p-6">
                <h3 className="font-serif text-xl text-foreground">{item.question}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
