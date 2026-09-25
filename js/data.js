// 2026-2027 学年秋季学期配置与课表种子数据（来源：校历.jpg / 课表1.png / 课表2.png）
const SEMESTER = {
  name: '2026-2027学年 第一学期（秋季）',
  startMonday: '2026-09-07', // 第1周周一
  totalWeeks: 19,
  holidays: {
    '2026-09-25': '中秋节',
    '2026-10-01': '国庆节',
    '2026-10-02': '国庆节',
    '2026-10-03': '国庆节',
    '2026-10-04': '国庆节',
    '2026-10-05': '国庆节',
    '2026-10-06': '国庆节',
    '2026-10-07': '国庆节',
    '2027-01-01': '元旦'
  }
};

// 教学作息时间表（14 节）
const PERIODS = [
  { n: 1, start: '08:00', end: '08:45' },
  { n: 2, start: '08:50', end: '09:35' },
  { n: 3, start: '09:50', end: '10:35' },
  { n: 4, start: '10:40', end: '11:25' },
  { n: 5, start: '11:30', end: '12:15' },
  { n: 6, start: '14:00', end: '14:45' },
  { n: 7, start: '14:50', end: '15:35' },
  { n: 8, start: '15:50', end: '16:35' },
  { n: 9, start: '16:40', end: '17:25' },
  { n: 10, start: '17:30', end: '18:15' },
  { n: 11, start: '19:00', end: '19:45' },
  { n: 12, start: '19:50', end: '20:35' },
  { n: 13, start: '20:40', end: '21:25' },
  { n: 14, start: '21:30', end: '22:15' }
];

// day: 1=周一 ... 5=周五；weeks 为闭区间列表
const COURSES = [
  { name: '法国歌剧史与作品赏析', teacher: '孙仰辉', room: '教学一号楼3004', day: 1, start: 1, end: 2, weeks: [[2, 9]] },
  { name: '综合法语(1)', teacher: 'GUIHO MYLENE', room: '教学二号楼4002', day: 1, start: 6, end: 7, weeks: [[2, 17]] },
  { name: '综合法语实训(1)', teacher: 'GUIHO MYLENE', room: '教学二号楼5003', day: 1, start: 8, end: 9, weeks: [[2, 17]] },
  { name: '基础英语(1)', teacher: '王金生', room: '教学一号楼4005', day: 1, start: 11, end: 12, weeks: [[2, 17]] },
  { name: '大学计算机基础', teacher: '张莹莹', room: '计算机房（R1-4090）', day: 2, start: 3, end: 5, weeks: [[2, 3], [5, 9]] },
  { name: '综合法语(1)', teacher: 'GUIHO MYLENE', room: '教学二号楼4002', day: 2, start: 6, end: 7, weeks: [[2, 17]] },
  { name: '综合法语(1)', teacher: '徐梦琪', room: '教学二号楼4004', day: 3, start: 3, end: 4, weeks: [[2, 17]] },
  { name: '心理健康(1)', teacher: '方瑶', room: '教学一号楼2004', day: 3, start: 8, end: 9, weeks: [[3, 3]] },
  { name: '体育(1)', teacher: '姚平', room: '杭州田径场', day: 4, start: 1, end: 2, weeks: [[2, 17]] },
  { name: '航空航天概论A', teacher: '田云', room: '教学一号楼2003', day: 4, start: 3, end: 4, weeks: [[2, 17]] },
  { name: '数学基础', teacher: '陈欢', room: '科研一号楼1001', day: 4, start: 6, end: 7, weeks: [[2, 17]] },
  { name: '综合法语(1)', teacher: '徐梦琪', room: '教学二号楼4004', day: 4, start: 11, end: 12, weeks: [[2, 17]] },
  { name: '习近平新时代中国特色社会主义思想概论', teacher: '董卓宁', room: '科研一号楼1040', day: 5, start: 1, end: 4, weeks: [[3, 3]] },
  { name: '综合法语实训(1)', teacher: '王歆轲', room: '教学一号楼B1001', day: 5, start: 7, end: 7, weeks: [[2, 17]] }
];
