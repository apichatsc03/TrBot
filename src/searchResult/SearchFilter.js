module.exports = [
    {
        filterTypeText: `โปรดเลือกประเภทกองทุนที่สนใจ โดยพิมพ์เฉพาะตัวเลขหน้าประเภทกองทุน\n\n0 -- ทุกประเภท\n1 -- ตลาดเงิน ลงทุนเฉพาะภายในประเทศ\n2 -- ตลาดเงิน ลงทุนในต่างประเทศบางส่วน\n3 -- พันธบัตรรัฐบาล\n4 -- ตราสารหนี้\n5 -- ผสม\n6 -- หุ้น\n7 -- หุ้นหมวดอุตสาหกรรมเฉพาะ\n8 -- สินทรัพย์ทางเลือก\n\nโดยสามารถเลือกได้หลายข้อพร้อมกัน เช่น สนใจกองทุนหุ้น\nและสินทรัพย์ทางเลือก พิมพ์ '6,8' หรือ สนใจกองทุนตราสารหนี้อย่างเดียว พิมพ์ '4'\n`,
        altFilter: "เลือก ตอบประเภทกองทุน ตามข้อ",
        key: 0
    },
    {
        filterTypeText: "ลดหย่อนภาษี",
        altFilter: "ลดหย่อนภาษี",
        key: 1,
        choices: [
            { text: "ทั้งหมด", value: 99 },
            { text: "ลดหย่อนภาษีได้", value: 1 },
            { text: "ลดหย่อนภาษีไม่ได้", value: 0 }
        ]
    },
    {
        filterTypeText: "ลงทุนใน/ต่างประเทศ",
        altFilter: "ลงทุนใน/ต่างประเทศ",
        key: 2,
        choices: [
            { text: "ทั้งหมด", value: 99 },
            { text: "ลงทุนในประเทศ", value: 1 },
            { text: "ลงทุนต่างประเทศ", value: 2 }
        ]
    }
    
]