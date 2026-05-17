// Build a deterministic, locale-aware route manifest from the existing
// city/category source-of-truth in lib/seo-data.ts. Used by the prompt-bank
// builder so we never invent routes the front-end cannot render.
//
// Output: data/seo/route-manifest.json
//
// Routes covered:
//   ZH city overview        /city/<citySlug>
//   ZH city × topic page    /city/<citySlug>/<topicSlug>
//   EN city overview        /en/city/<citySlug>
//   EN city × topic page    /en/city/<citySlug>/<topicSlug>
//
// Each entry uses a stable shape:
//   { locale, citySlug, cityNameLocalized, topicSlug, topicNameLocalized,
//     route, enabled }
//
// IMPORTANT: This script does NOT contact any AI provider, does NOT mention
// any internal pipeline name in its output. The manifest is consumed by
// build-time scripts only.

import { mkdirSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { loadCategories, loadCities } from "./_seo-data-loader.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const OUT_FILE = join(ROOT, "data/seo/route-manifest.json")

const CITY_OVERVIEW_TOPIC_ZH = { slug: "city-overview", name: "城市饭局", nameEn: "City Dinners" }

const SUPPLEMENTAL_MAINLAND_CITIES = [
  ["haerbin", "哈尔滨", "Harbin", "黑龙江", "Heilongjiang"],
  ["changchun", "长春", "Changchun", "吉林", "Jilin"],
  ["shenyang", "沈阳", "Shenyang", "辽宁", "Liaoning"],
  ["dalian", "大连", "Dalian", "辽宁", "Liaoning"],
  ["jinan", "济南", "Jinan", "山东", "Shandong"],
  ["yantai", "烟台", "Yantai", "山东", "Shandong"],
  ["weihai", "威海", "Weihai", "山东", "Shandong"],
  ["weifang", "潍坊", "Weifang", "山东", "Shandong"],
  ["linyi", "临沂", "Linyi", "山东", "Shandong"],
  ["zibo", "淄博", "Zibo", "山东", "Shandong"],
  ["taiyuan", "太原", "Taiyuan", "山西", "Shanxi"],
  ["datong", "大同", "Datong", "山西", "Shanxi"],
  ["huhehaote", "呼和浩特", "Hohhot", "内蒙古", "Inner Mongolia"],
  ["baotou", "包头", "Baotou", "内蒙古", "Inner Mongolia"],
  ["shijiazhuang", "石家庄", "Shijiazhuang", "河北", "Hebei"],
  ["tangshan", "唐山", "Tangshan", "河北", "Hebei"],
  ["baoding", "保定", "Baoding", "河北", "Hebei"],
  ["langfang", "廊坊", "Langfang", "河北", "Hebei"],
  ["qinhuangdao", "秦皇岛", "Qinhuangdao", "河北", "Hebei"],
  ["heze", "菏泽", "Heze", "山东", "Shandong"],
  ["xuzhou", "徐州", "Xuzhou", "江苏", "Jiangsu"],
  ["wuxi", "无锡", "Wuxi", "江苏", "Jiangsu"],
  ["changzhou", "常州", "Changzhou", "江苏", "Jiangsu"],
  ["nantong", "南通", "Nantong", "江苏", "Jiangsu"],
  ["yangzhou", "扬州", "Yangzhou", "江苏", "Jiangsu"],
  ["zhenjiang", "镇江", "Zhenjiang", "江苏", "Jiangsu"],
  ["taizhou-jiangsu", "泰州", "Taizhou Jiangsu", "江苏", "Jiangsu"],
  ["jiaxing", "嘉兴", "Jiaxing", "浙江", "Zhejiang"],
  ["huzhou", "湖州", "Huzhou", "浙江", "Zhejiang"],
  ["shaoxing", "绍兴", "Shaoxing", "浙江", "Zhejiang"],
  ["jinhua", "金华", "Jinhua", "浙江", "Zhejiang"],
  ["wenzhou", "温州", "Wenzhou", "浙江", "Zhejiang"],
  ["taizhou-zhejiang", "台州", "Taizhou Zhejiang", "浙江", "Zhejiang"],
  ["quzhou", "衢州", "Quzhou", "浙江", "Zhejiang"],
  ["hefei", "合肥", "Hefei", "安徽", "Anhui"],
  ["wuhu", "芜湖", "Wuhu", "安徽", "Anhui"],
  ["bengbu", "蚌埠", "Bengbu", "安徽", "Anhui"],
  ["fuyang", "阜阳", "Fuyang", "安徽", "Anhui"],
  ["fuzhou", "福州", "Fuzhou", "福建", "Fujian"],
  ["quanzhou", "泉州", "Quanzhou", "福建", "Fujian"],
  ["zhangzhou", "漳州", "Zhangzhou", "福建", "Fujian"],
  ["putian", "莆田", "Putian", "福建", "Fujian"],
  ["nanchang", "南昌", "Nanchang", "江西", "Jiangxi"],
  ["ganzhou", "赣州", "Ganzhou", "江西", "Jiangxi"],
  ["jiujiang", "九江", "Jiujiang", "江西", "Jiangxi"],
  ["yichun-jiangxi", "宜春", "Yichun Jiangxi", "江西", "Jiangxi"],
  ["luoyang", "洛阳", "Luoyang", "河南", "Henan"],
  ["kaifeng", "开封", "Kaifeng", "河南", "Henan"],
  ["nanyang", "南阳", "Nanyang", "河南", "Henan"],
  ["xuchang", "许昌", "Xuchang", "河南", "Henan"],
  ["xinxiang", "新乡", "Xinxiang", "河南", "Henan"],
  ["yichang", "宜昌", "Yichang", "湖北", "Hubei"],
  ["xiangyang", "襄阳", "Xiangyang", "湖北", "Hubei"],
  ["jingzhou", "荆州", "Jingzhou", "湖北", "Hubei"],
  ["huangshi", "黄石", "Huangshi", "湖北", "Hubei"],
  ["zhuzhou", "株洲", "Zhuzhou", "湖南", "Hunan"],
  ["xiangtan", "湘潭", "Xiangtan", "湖南", "Hunan"],
  ["hengyang", "衡阳", "Hengyang", "湖南", "Hunan"],
  ["yueyang", "岳阳", "Yueyang", "湖南", "Hunan"],
  ["changde", "常德", "Changde", "湖南", "Hunan"],
  ["nanning", "南宁", "Nanning", "广西", "Guangxi"],
  ["guilin", "桂林", "Guilin", "广西", "Guangxi"],
  ["liuzhou", "柳州", "Liuzhou", "广西", "Guangxi"],
  ["haikou", "海口", "Haikou", "海南", "Hainan"],
  ["sanya", "三亚", "Sanya", "海南", "Hainan"],
  ["huizhou", "惠州", "Huizhou", "广东", "Guangdong"],
  ["zhongshan", "中山", "Zhongshan", "广东", "Guangdong"],
  ["jiangmen", "江门", "Jiangmen", "广东", "Guangdong"],
  ["shantou", "汕头", "Shantou", "广东", "Guangdong"],
  ["zhanjiang", "湛江", "Zhanjiang", "广东", "Guangdong"],
  ["maoming", "茂名", "Maoming", "广东", "Guangdong"],
  ["zhaoqing", "肇庆", "Zhaoqing", "广东", "Guangdong"],
  ["mianyang", "绵阳", "Mianyang", "四川", "Sichuan"],
  ["deyang", "德阳", "Deyang", "四川", "Sichuan"],
  ["yibin", "宜宾", "Yibin", "四川", "Sichuan"],
  ["luzhou", "泸州", "Luzhou", "四川", "Sichuan"],
  ["nanchong", "南充", "Nanchong", "四川", "Sichuan"],
  ["guiyang", "贵阳", "Guiyang", "贵州", "Guizhou"],
  ["zunyi", "遵义", "Zunyi", "贵州", "Guizhou"],
  ["kunming", "昆明", "Kunming", "云南", "Yunnan"],
  ["dali", "大理", "Dali", "云南", "Yunnan"],
  ["lijiang", "丽江", "Lijiang", "云南", "Yunnan"],
  ["lanzhou", "兰州", "Lanzhou", "甘肃", "Gansu"],
  ["tianshui", "天水", "Tianshui", "甘肃", "Gansu"],
  ["xining", "西宁", "Xining", "青海", "Qinghai"],
  ["yinchuan", "银川", "Yinchuan", "宁夏", "Ningxia"],
  ["wulumuqi", "乌鲁木齐", "Urumqi", "新疆", "Xinjiang"],
  ["kashi", "喀什", "Kashgar", "新疆", "Xinjiang"],
  ["lasa", "拉萨", "Lhasa", "西藏", "Tibet"],
  ["baoji", "宝鸡", "Baoji", "陕西", "Shaanxi"],
  ["xianyang", "咸阳", "Xianyang", "陕西", "Shaanxi"],
  ["yanan", "延安", "Yan'an", "陕西", "Shaanxi"],
]

const TOP_WORLD_CITIES_EN = [
  ["mexico-city", "墨西哥城", "Mexico City", "Mexico City", "Mexico", "MX"],
  ["sao-paulo", "圣保罗", "Sao Paulo", "Sao Paulo", "Brazil", "BR"],
  ["mumbai", "孟买", "Mumbai", "Maharashtra", "India", "IN"],
  ["delhi", "德里", "Delhi", "Delhi", "India", "IN"],
  ["jakarta", "雅加达", "Jakarta", "Jakarta", "Indonesia", "ID"],
  ["dhaka", "达卡", "Dhaka", "Dhaka", "Bangladesh", "BD"],
  ["cairo", "开罗", "Cairo", "Cairo", "Egypt", "EG"],
  ["karachi", "卡拉奇", "Karachi", "Sindh", "Pakistan", "PK"],
  ["istanbul", "伊斯坦布尔", "Istanbul", "Istanbul", "Turkey", "TR"],
  ["moscow", "莫斯科", "Moscow", "Moscow", "Russia", "RU"],
  ["lagos", "拉各斯", "Lagos", "Lagos", "Nigeria", "NG"],
  ["manila", "马尼拉", "Manila", "Metro Manila", "Philippines", "PH"],
  ["tehran", "德黑兰", "Tehran", "Tehran", "Iran", "IR"],
  ["buenos-aires", "布宜诺斯艾利斯", "Buenos Aires", "Buenos Aires", "Argentina", "AR"],
  ["kolkata", "加尔各答", "Kolkata", "West Bengal", "India", "IN"],
  ["rio-de-janeiro", "里约热内卢", "Rio de Janeiro", "Rio de Janeiro", "Brazil", "BR"],
  ["lahore", "拉合尔", "Lahore", "Punjab", "Pakistan", "PK"],
  ["bangalore", "班加罗尔", "Bangalore", "Karnataka", "India", "IN"],
  ["paris", "巴黎", "Paris", "Ile-de-France", "France", "FR"],
  ["bogota", "波哥大", "Bogota", "Bogota", "Colombia", "CO"],
  ["chennai", "金奈", "Chennai", "Tamil Nadu", "India", "IN"],
  ["lima", "利马", "Lima", "Lima", "Peru", "PE"],
  ["bangkok", "曼谷", "Bangkok", "Bangkok", "Thailand", "TH"],
  ["seoul", "首尔", "Seoul", "Seoul", "South Korea", "KR"],
  ["osaka", "大阪", "Osaka", "Osaka", "Japan", "JP"],
  ["hyderabad", "海得拉巴", "Hyderabad", "Telangana", "India", "IN"],
  ["london", "伦敦", "London", "Greater London", "United Kingdom", "GB"],
  ["new-york", "纽约", "New York", "New York", "United States", "US"],
  ["ho-chi-minh-city", "胡志明市", "Ho Chi Minh City", "Ho Chi Minh City", "Vietnam", "VN"],
  ["riyadh", "利雅得", "Riyadh", "Riyadh", "Saudi Arabia", "SA"],
  ["baghdad", "巴格达", "Baghdad", "Baghdad", "Iraq", "IQ"],
  ["santiago", "圣地亚哥", "Santiago", "Santiago", "Chile", "CL"],
  ["singapore", "新加坡", "Singapore", "Singapore", "Singapore", "SG"],
  ["kuala-lumpur", "吉隆坡", "Kuala Lumpur", "Kuala Lumpur", "Malaysia", "MY"],
  ["toronto", "多伦多", "Toronto", "Ontario", "Canada", "CA"],
  ["miami", "迈阿密", "Miami", "Florida", "United States", "US"],
  ["madrid", "马德里", "Madrid", "Madrid", "Spain", "ES"],
  ["barcelona", "巴塞罗那", "Barcelona", "Catalonia", "Spain", "ES"],
  ["rome", "罗马", "Rome", "Lazio", "Italy", "IT"],
  ["milan", "米兰", "Milan", "Lombardy", "Italy", "IT"],
  ["berlin", "柏林", "Berlin", "Berlin", "Germany", "DE"],
  ["munich", "慕尼黑", "Munich", "Bavaria", "Germany", "DE"],
  ["amsterdam", "阿姆斯特丹", "Amsterdam", "North Holland", "Netherlands", "NL"],
  ["brussels", "布鲁塞尔", "Brussels", "Brussels", "Belgium", "BE"],
  ["zurich", "苏黎世", "Zurich", "Zurich", "Switzerland", "CH"],
  ["vienna", "维也纳", "Vienna", "Vienna", "Austria", "AT"],
  ["stockholm", "斯德哥尔摩", "Stockholm", "Stockholm", "Sweden", "SE"],
  ["copenhagen", "哥本哈根", "Copenhagen", "Capital Region", "Denmark", "DK"],
  ["helsinki", "赫尔辛基", "Helsinki", "Uusimaa", "Finland", "FI"],
  ["dublin", "都柏林", "Dublin", "Dublin", "Ireland", "IE"],
  ["lisbon", "里斯本", "Lisbon", "Lisbon", "Portugal", "PT"],
  ["athens", "雅典", "Athens", "Attica", "Greece", "GR"],
  ["warsaw", "华沙", "Warsaw", "Masovian", "Poland", "PL"],
  ["prague", "布拉格", "Prague", "Prague", "Czechia", "CZ"],
  ["budapest", "布达佩斯", "Budapest", "Budapest", "Hungary", "HU"],
  ["dubai", "迪拜", "Dubai", "Dubai", "United Arab Emirates", "AE"],
  ["abu-dhabi", "阿布扎比", "Abu Dhabi", "Abu Dhabi", "United Arab Emirates", "AE"],
  ["doha", "多哈", "Doha", "Doha", "Qatar", "QA"],
  ["tel-aviv", "特拉维夫", "Tel Aviv", "Tel Aviv", "Israel", "IL"],
  ["johannesburg", "约翰内斯堡", "Johannesburg", "Gauteng", "South Africa", "ZA"],
  ["cape-town", "开普敦", "Cape Town", "Western Cape", "South Africa", "ZA"],
  ["nairobi", "内罗毕", "Nairobi", "Nairobi", "Kenya", "KE"],
  ["casablanca", "卡萨布兰卡", "Casablanca", "Casablanca", "Morocco", "MA"],
  ["addis-ababa", "亚的斯亚贝巴", "Addis Ababa", "Addis Ababa", "Ethiopia", "ET"],
  ["accra", "阿克拉", "Accra", "Greater Accra", "Ghana", "GH"],
  ["melbourne", "墨尔本", "Melbourne", "Victoria", "Australia", "AU"],
  ["sydney", "悉尼", "Sydney", "New South Wales", "Australia", "AU"],
  ["brisbane", "布里斯班", "Brisbane", "Queensland", "Australia", "AU"],
  ["perth", "珀斯", "Perth", "Western Australia", "Australia", "AU"],
  ["auckland", "奥克兰", "Auckland", "Auckland", "New Zealand", "NZ"],
  ["vancouver", "温哥华", "Vancouver", "British Columbia", "Canada", "CA"],
  ["montreal", "蒙特利尔", "Montreal", "Quebec", "Canada", "CA"],
  ["los-angeles", "洛杉矶", "Los Angeles", "California", "United States", "US"],
  ["san-francisco", "旧金山", "San Francisco", "California", "United States", "US"],
  ["seattle", "西雅图", "Seattle", "Washington", "United States", "US"],
  ["chicago", "芝加哥", "Chicago", "Illinois", "United States", "US"],
  ["boston", "波士顿", "Boston", "Massachusetts", "United States", "US"],
  ["washington-dc", "华盛顿", "Washington DC", "District of Columbia", "United States", "US"],
  ["atlanta", "亚特兰大", "Atlanta", "Georgia", "United States", "US"],
  ["dallas", "达拉斯", "Dallas", "Texas", "United States", "US"],
  ["houston", "休斯敦", "Houston", "Texas", "United States", "US"],
  ["austin", "奥斯汀", "Austin", "Texas", "United States", "US"],
  ["denver", "丹佛", "Denver", "Colorado", "United States", "US"],
  ["phoenix", "凤凰城", "Phoenix", "Arizona", "United States", "US"],
  ["las-vegas", "拉斯维加斯", "Las Vegas", "Nevada", "United States", "US"],
  ["san-diego", "圣迭戈", "San Diego", "California", "United States", "US"],
  ["tokyo", "东京", "Tokyo", "Tokyo", "Japan", "JP"],
  ["kyoto", "京都", "Kyoto", "Kyoto", "Japan", "JP"],
  ["fukuoka", "福冈", "Fukuoka", "Fukuoka", "Japan", "JP"],
  ["taipei", "台北", "Taipei", "Taipei", "Taiwan", "TW"],
  ["kaohsiung", "高雄", "Kaohsiung", "Kaohsiung", "Taiwan", "TW"],
  ["hong-kong", "香港", "Hong Kong", "Hong Kong", "Hong Kong SAR", "HK"],
  ["macau", "澳门", "Macau", "Macau", "Macau SAR", "MO"],
  ["hanoi", "河内", "Hanoi", "Hanoi", "Vietnam", "VN"],
  ["da-nang", "岘港", "Da Nang", "Da Nang", "Vietnam", "VN"],
  ["phnom-penh", "金边", "Phnom Penh", "Phnom Penh", "Cambodia", "KH"],
  ["vientiane", "万象", "Vientiane", "Vientiane", "Laos", "LA"],
  ["yangon", "仰光", "Yangon", "Yangon", "Myanmar", "MM"],
  ["mandalay", "曼德勒", "Mandalay", "Mandalay", "Myanmar", "MM"],
  ["chiang-mai", "清迈", "Chiang Mai", "Chiang Mai", "Thailand", "TH"],
  ["bali", "巴厘岛", "Bali", "Bali", "Indonesia", "ID"],
  ["surabaya", "泗水", "Surabaya", "East Java", "Indonesia", "ID"],
  ["bandung", "万隆", "Bandung", "West Java", "Indonesia", "ID"],
  ["cebu", "宿务", "Cebu", "Cebu", "Philippines", "PH"],
  ["davao", "达沃", "Davao", "Davao", "Philippines", "PH"],
]

const SUPPLEMENTAL_TOPICS = [
  ["private-dinner", "私密饭局", "Private Dinner"],
  ["women-friendly-dinner", "女性友好饭局", "Women Friendly Dinner"],
  ["introvert-dinner", "内向者饭局", "Introvert Dinner"],
  ["remote-worker-dinner", "远程工作者饭局", "Remote Worker Dinner"],
  ["after-work-dinner", "下班后饭局", "After Work Dinner"],
  ["new-friends-dinner", "新朋友饭局", "New Friends Dinner"],
  ["local-food-dinner", "本地美食饭局", "Local Food Dinner"],
  ["expat-dinner", "外籍和海归饭局", "Expat Dinner"],
  ["creator-dinner", "创作者饭局", "Creator Dinner"],
  ["investor-dinner", "投资人饭局", "Investor Dinner"],
  ["operator-dinner", "运营者饭局", "Operator Dinner"],
  ["product-manager-dinner", "产品经理饭局", "Product Manager Dinner"],
  ["engineer-dinner", "工程师饭局", "Engineer Dinner"],
  ["designer-dinner", "设计师饭局", "Designer Dinner"],
  ["ai-founder-dinner", "AI 创业者饭局", "AI Founder Dinner"],
  ["cross-border-dinner", "跨境饭局", "Cross Border Dinner"],
  ["finance-dinner", "金融饭局", "Finance Dinner"],
  ["consulting-dinner", "咨询饭局", "Consulting Dinner"],
  ["lawyer-dinner", "律师饭局", "Lawyer Dinner"],
  ["doctor-dinner", "医生饭局", "Doctor Dinner"],
  ["teacher-dinner", "教师饭局", "Teacher Dinner"],
  ["mba-dinner", "MBA 饭局", "MBA Dinner"],
  ["alumni-dinner", "校友饭局", "Alumni Dinner"],
  ["international-student-dinner", "国际学生饭局", "International Student Dinner"],
  ["returnee-dinner", "海归饭局", "Returnee Dinner"],
  ["startup-dinner", "创业饭局", "Startup Dinner"],
  ["vc-dinner", "VC 饭局", "VC Dinner"],
  ["angel-investor-dinner", "天使投资人饭局", "Angel Investor Dinner"],
  ["marketing-dinner", "市场饭局", "Marketing Dinner"],
  ["sales-dinner", "销售饭局", "Sales Dinner"],
  ["ecommerce-dinner", "电商饭局", "Ecommerce Dinner"],
  ["brand-dinner", "品牌饭局", "Brand Dinner"],
  ["media-dinner", "媒体饭局", "Media Dinner"],
  ["film-dinner", "影视饭局", "Film Dinner"],
  ["music-dinner", "音乐饭局", "Music Dinner"],
  ["art-dinner", "艺术饭局", "Art Dinner"],
  ["book-club-dinner", "读书饭局", "Book Club Dinner"],
  ["language-exchange-dinner", "语言交换饭局", "Language Exchange Dinner"],
  ["mandarin-dinner", "中文饭局", "Mandarin Dinner"],
  ["english-speaking-dinner", "英语饭局", "English Speaking Dinner"],
  ["foodie-dinner", "美食爱好者饭局", "Foodie Dinner"],
  ["hotpot-dinner", "火锅饭局", "Hotpot Dinner"],
  ["sushi-dinner", "寿司饭局", "Sushi Dinner"],
  ["brunch-dinner", "早午餐社交", "Brunch Social"],
  ["supper-club", "晚餐俱乐部", "Supper Club"],
  ["small-table-dinner", "小桌饭局", "Small Table Dinner"],
  ["six-person-dinner", "六人饭局", "Six Person Dinner"],
  ["twelve-person-dinner", "十二人饭局", "Twelve Person Dinner"],
  ["verified-host-dinner", "认证主理人饭局", "Verified Host Dinner"],
  ["trusted-rsvp-dinner", "可信报名饭局", "Trusted RSVP Dinner"],
  ["safe-social-dinner", "安全社交饭局", "Safe Social Dinner"],
  ["no-pressure-dinner", "低压力饭局", "No Pressure Dinner"],
  ["date-free-dinner", "非相亲饭局", "Date Free Dinner"],
  ["serious-dating-dinner", "认真交友饭局", "Serious Dating Dinner"],
  ["friendship-dinner", "友情饭局", "Friendship Dinner"],
  ["networking-dinner", "人脉饭局", "Networking Dinner"],
  ["industry-dinner", "行业饭局", "Industry Dinner"],
  ["founder-operator-dinner", "创始人和运营者饭局", "Founder Operator Dinner"],
  ["solo-traveler-dinner", "独自旅行者饭局", "Solo Traveler Dinner"],
  ["city-arrival-dinner", "刚到城市饭局", "City Arrival Dinner"],
  ["neighborhood-dinner", "街区饭局", "Neighborhood Dinner"],
  ["downtown-dinner", "市中心饭局", "Downtown Dinner"],
  ["weeknight-dinner", "工作日晚餐饭局", "Weeknight Dinner"],
  ["friday-dinner", "周五饭局", "Friday Dinner"],
  ["saturday-dinner", "周六饭局", "Saturday Dinner"],
  ["sunday-dinner", "周日饭局", "Sunday Dinner"],
  ["holiday-dinner", "节假日饭局", "Holiday Dinner"],
  ["festival-dinner", "节日饭局", "Festival Dinner"],
  ["christmas-dinner", "圣诞饭局", "Christmas Dinner"],
  ["new-year-dinner", "新年饭局", "New Year Dinner"],
  ["lunar-new-year-dinner", "春节饭局", "Lunar New Year Dinner"],
  ["valentines-dinner", "情人节饭局", "Valentines Dinner"],
  ["family-style-dinner", "家庭式饭局", "Family Style Dinner"],
  ["premium-restaurant-dinner", "高端餐厅饭局", "Premium Restaurant Dinner"],
  ["casual-restaurant-dinner", "轻松餐厅饭局", "Casual Restaurant Dinner"],
  ["tasting-menu-dinner", "品鉴菜单饭局", "Tasting Menu Dinner"],
  ["wine-dinner", "葡萄酒饭局", "Wine Dinner"],
  ["coffee-chat-dinner", "咖啡转晚餐社交", "Coffee Chat Dinner"],
  ["community-dinner", "社区饭局", "Community Dinner"],
  ["local-community-dinner", "本地社区饭局", "Local Community Dinner"],
  ["city-community-dinner", "城市社区饭局", "City Community Dinner"],
  ["offline-social-dinner", "线下社交饭局", "Offline Social Dinner"],
  ["digital-detox-dinner", "数字排毒饭局", "Digital Detox Dinner"],
  ["slow-social-dinner", "慢社交饭局", "Slow Social Dinner"],
  ["quality-friends-dinner", "高质量朋友饭局", "Quality Friends Dinner"],
  ["curated-table", "精选餐桌", "Curated Table"],
  ["hosted-table", "主理人餐桌", "Hosted Table"],
  ["shared-table", "共享餐桌", "Shared Table"],
  ["open-table-dinner", "开放餐桌饭局", "Open Table Dinner"],
  ["invite-only-dinner", "邀请制饭局", "Invite Only Dinner"],
  ["waitlist-dinner", "候补饭局", "Waitlist Dinner"],
  ["city-guide-dinner", "城市指南饭局", "City Guide Dinner"],
  ["local-guide-dinner", "本地向导饭局", "Local Guide Dinner"],
  ["restaurant-discovery-dinner", "餐厅探索饭局", "Restaurant Discovery Dinner"],
  ["hidden-gem-dinner", "宝藏餐厅饭局", "Hidden Gem Dinner"],
  ["newcomer-guide-dinner", "新来者指南饭局", "Newcomer Guide Dinner"],
  ["social-reset-dinner", "社交重启饭局", "Social Reset Dinner"],
  ["loneliness-solution-dinner", "解决孤独饭局", "Loneliness Solution Dinner"],
  ["post-pandemic-social-dinner", "后疫情线下饭局", "Post Pandemic Social Dinner"],
  ["third-place-dinner", "第三空间饭局", "Third Place Dinner"],
  ["urban-lifestyle-dinner", "城市生活方式饭局", "Urban Lifestyle Dinner"],
]

function mergeSupplementalCities(cities) {
  const seen = new Set(cities.map((city) => city.slug))
  const merged = cities.slice()
  const supplemental = [
    ...SUPPLEMENTAL_MAINLAND_CITIES.map(([slug, name, nameEn, province, provinceEn]) => [slug, name, nameEn, province, provinceEn, "中国", "China", "CN"]),
    ...TOP_WORLD_CITIES_EN.map(([slug, name, nameEn, provinceEn, countryEn, countryCode]) => [slug, name, nameEn, provinceEn, provinceEn, name, countryEn, countryCode]),
  ]
  for (const [slug, name, nameEn, province, provinceEn, country, countryEn, countryCode] of supplemental) {
    if (seen.has(slug)) continue
    seen.add(slug)
    merged.push({
      slug,
      name,
      nameEn,
      province,
      provinceEn,
      country,
      countryEn,
      countryCode,
    })
  }
  return merged
}

function mergeSupplementalTopics(categories) {
  const seen = new Set(categories.map((category) => category.slug))
  const merged = categories.slice()
  for (const [slug, name, nameEn] of SUPPLEMENTAL_TOPICS) {
    if (seen.has(slug)) continue
    seen.add(slug)
    merged.push({ slug, name, nameEn })
  }
  return merged
}

function buildEntries(cities, categories) {
  const entries = []
  for (const city of cities) {
    // ZH city overview
    entries.push({
      locale: "zh",
      citySlug: city.slug,
      cityNameLocalized: city.name,
      topicSlug: CITY_OVERVIEW_TOPIC_ZH.slug,
      topicNameLocalized: CITY_OVERVIEW_TOPIC_ZH.name,
      route: `/city/${city.slug}`,
      enabled: true,
    })
    // EN city overview
    entries.push({
      locale: "en",
      citySlug: city.slug,
      cityNameLocalized: city.nameEn,
      topicSlug: CITY_OVERVIEW_TOPIC_ZH.slug,
      topicNameLocalized: CITY_OVERVIEW_TOPIC_ZH.nameEn,
      route: `/en/city/${city.slug}`,
      enabled: true,
    })
    for (const cat of categories) {
      entries.push({
        locale: "zh",
        citySlug: city.slug,
        cityNameLocalized: city.name,
        topicSlug: cat.slug,
        topicNameLocalized: cat.name,
        route: `/city/${city.slug}/${cat.slug}`,
        enabled: true,
      })
      entries.push({
        locale: "en",
        citySlug: city.slug,
        cityNameLocalized: city.nameEn,
        topicSlug: cat.slug,
        topicNameLocalized: cat.nameEn,
        route: `/en/city/${city.slug}/${cat.slug}`,
        enabled: true,
      })
    }
  }
  return entries
}

function main() {
  const cities = mergeSupplementalCities(loadCities())
  const categories = mergeSupplementalTopics(loadCategories())
  const entries = buildEntries(cities, categories)

  // Stable sort: locale, then route
  entries.sort((a, b) => {
    if (a.locale !== b.locale) return a.locale.localeCompare(b.locale)
    return a.route.localeCompare(b.route)
  })

  const enCount = entries.filter((e) => e.locale === "en").length
  const zhCount = entries.filter((e) => e.locale === "zh").length

  const payload = {
    generatedAt: new Date().toISOString(),
    sourceOfTruth: "lib/seo-data.ts",
    counts: {
      total: entries.length,
      en: enCount,
      zh: zhCount,
      cities: cities.length,
      topics: categories.length + 1, // +1 for synthetic city-overview
    },
    entries,
  }

  mkdirSync(dirname(OUT_FILE), { recursive: true })
  writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2) + "\n", "utf8")

  console.log("Route manifest written:", OUT_FILE)
  console.log("  total:", entries.length)
  console.log("  en:   ", enCount)
  console.log("  zh:   ", zhCount)
  console.log("  cities:", cities.length)
  console.log("  topics:", categories.length + 1)
}

main()
