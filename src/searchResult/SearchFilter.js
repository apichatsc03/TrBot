module.exports = [
    {
        filterTypeText: `ประเภทกองทุน\n\n0) ทุกประเภท\n1) กองทุนรวมตลาดเงินที่ลงทุนเฉพาะภายในประเทศ\n2) กองทุนรวมตลาดเงินที่ลงทุนในต่างประเทศบางส่วน\n3) กองทุนรวมพันธบัตรรัฐบาล\n4) กองทุนรวมตราสารหนี้\n5) กองทุนรวมผสม\n6) กองทุนรวมหุ้น\n7) กองทุนรวมหุ้นหมวดอุตสาหกรรมเฉพาะ\n8) กองทุนรวมที่ลงทุนในสินทรัพย์ทางเลือก\n\nสามารถเลือกตอบได้หลายข้อ โดยการพิมพ์เลขข้อเป็นตัวเลข ตัวอย่าง '1,3,5,7'`,
        altFilter: "เลือก ตอบประเภทกองทุน ตามข้อ",
        key: 0
    },
    {
        filterTypeText: "ลดหย่อนภาษี",
        altFilter: "ลดหย่อนภาษี",
        key: 1,
        choices: [
            { text: "ทั้งหมด", value: 99 },
            { text: "ลดหย่อนภาษีได้", value: 0 },
            { text: "ลดหย่อนภาษีไม่ได้", value: 1 }
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