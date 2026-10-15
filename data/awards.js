/* =========================================================
   🏆 جوائز الدفعة - Fun Awards
   قسم الفيزياء الطبية - جامعة الهادي 2027
   =========================================================
   
   📝 كيف تعدل؟
   
   لكل جائزة:
   - id:       رقم تسلسلي
   - title:    اسم الجائزة
   - icon:     أيقونة (إيموجي)
   - color:    لون الجائزة (hex)
   - nominees: قائمة المرشحين — كل مرشح فيه:
       - studentId:  رقم الطالب في students.js (إجباري)
       - votes:      عدد الأصوات (حدّثه بعد جمع الأصوات)
   
   💡 لإضافة جائزة جديدة: انسخ نموذجاً والصقه في الأسفل
   💡 لإضافة مرشح: أضف عنصراً جديداً في nominees
   💡 الترتيب يتم تلقائياً حسب عدد الأصوات
*/

const awards = [
    {
        id: 1,
        title: "أكثر شخص مبتسم",
        icon: "😊",
        color: "#fbbf24",
        nominees: [
            { studentId: 1, votes: 45 },
            { studentId: 5, votes: 32 },
            { studentId: 12, votes: 18 },
            { studentId: 45, votes: 10 }
        ]
    },
    {
        id: 2,
        title: "عبقري الفيزياء",
        icon: "🧠",
        color: "#a855f7",
        nominees: [
            { studentId: 3, votes: 52 },
            { studentId: 7, votes: 28 },
            { studentId: 20, votes: 15 }
        ]
    },
    {
        id: 3,
        title: "مدمن قهوة ☕",
        icon: "☕",
        color: "#b45309",
        nominees: [
            { studentId: 2, votes: 38 },
            { studentId: 9, votes: 35 },
            { studentId: 15, votes: 22 },
            { studentId: 33, votes: 12 }
        ]
    },
    {
        id: 4,
        title: "أفضل صديق للجميع",
        icon: "🤝",
        color: "#10b981",
        nominees: [
            { studentId: 6, votes: 48 },
            { studentId: 8, votes: 30 },
            { studentId: 25, votes: 20 }
        ]
    },
    {
        id: 5,
        title: "من ينام في المحاضرة الأولى",
        icon: "😴",
        color: "#6366f1",
        nominees: [
            { studentId: 11, votes: 40 },
            { studentId: 14, votes: 25 },
            { studentId: 19, votes: 20 },
            { studentId: 22, votes: 15 }
        ]
    },
    {
        id: 6,
        title: "أفضل صوت في الدفعة",
        icon: "🎤",
        color: "#ec4899",
        nominees: [
            { studentId: 4, votes: 55 },
            { studentId: 16, votes: 28 },
            { studentId: 28, votes: 17 }
        ]
    },
    {
        id: 7,
        title: "أكثر شخص منظم",
        icon: "📊",
        color: "#0ea5e9",
        nominees: [
            { studentId: 10, votes: 42 },
            { studentId: 13, votes: 30 },
            { studentId: 24, votes: 18 }
        ]
    },
    {
        id: 8,
        title: "ملك/ملكة السهر",
        icon: "🌙",
        color: "#8b5cf6",
        nominees: [
            { studentId: 17, votes: 35 },
            { studentId: 21, votes: 30 },
            { studentId: 27, votes: 25 }
        ]
    }
    
    // ⬇️ أضف جوائز جديدة هنا بنفس الطريقة ⬇️
    // ,
    // {
    //     id: 9,
    //     title: "اسم الجائزة",
    //     icon: "🎯",
    //     color: "#ff5733",
    //     nominees: [
    //         { studentId: 5, votes: 20 },
    //         { studentId: 10, votes: 15 }
    //     ]
    // }
];