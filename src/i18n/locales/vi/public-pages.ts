import en from "../en/public-pages";

const publicPages = {
  ...en,
  breadcrumbs: { home: "Trang chủ", services: "Dịch vụ", doctors: "Bác sĩ" },
  common: {
    notFoundTitle: "Không tìm thấy trang",
    notFoundDescription:
      "Thông tin bạn yêu cầu không có sẵn. Vui lòng quay lại trang chủ.",
    backHome: "Về trang chủ",
    explore: "Khám phá",
    book: "Đặt lịch hẹn",
    areas: "Lĩnh vực thực hành",
    expect: "Điều bạn có thể mong đợi",
  },
  services: {
    ...en.services,
    title: "Dịch vụ cho mọi giai đoạn của nụ cười",
    intro:
      "Chăm sóc nha khoa rõ ràng, tận tâm cho nhu cầu hằng ngày và sức khỏe lâu dài.",
    detailIntro:
      "Cách chăm sóc chu đáo, dựa trên câu hỏi, sự thoải mái và mục tiêu của bạn.",
    benefits: "Lợi ích của dịch vụ",
    items: {
      "general-dentistry": {
        title: "Nha khoa tổng quát",
        short: "Chăm sóc hằng ngày giúp duy trì nụ cười khỏe mạnh.",
        detail:
          "Thăm khám định kỳ và phục hồi giúp bạn hiểu rõ sức khỏe răng miệng để đưa ra quyết định chăm sóc phù hợp.",
        benefits: [
          "Chăm sóc phòng ngừa thường xuyên",
          "Giải thích rõ ràng trong mỗi lần khám",
          "Kế hoạch điều trị phù hợp nhu cầu cá nhân",
        ],
      },
      "dental-cleaning": {
        title: "Vệ sinh răng",
        short: "Trải nghiệm làm sạch nhẹ nhàng, mang lại cảm giác tươi mới cho răng miệng.",
        detail:
          "Dịch vụ cạo vôi và làm sạch chuyên nghiệp hỗ trợ thói quen vệ sinh hằng ngày, giúp răng nướu luôn khỏe mạnh.",
        benefits: [
          "Cảm giác sạch thoáng, dễ chịu",
          "Hỗ trợ bảo vệ nướu chắc khỏe",
          "Hướng dẫn cách chăm sóc tại nhà thiết thực",
        ],
      },
      "teeth-whitening": {
        title: "Tẩy trắng răng",
        short: "Nụ cười rạng rỡ hơn với kế hoạch dành riêng cho bạn.",
        detail:
          "Tìm hiểu các giải pháp tẩy trắng an toàn cùng sự tư vấn chu đáo xem phương pháp nào phù hợp nhất với nụ cười và mong muốn của bạn.",
        benefits: [
          "Tư vấn cá nhân hóa tận tình",
          "Hướng dẫn chăm sóc rõ ràng",
          "Kế hoạch hướng đến sự êm ái, dễ chịu",
        ],
      },
      "dental-implants": {
        title: "Cấy ghép răng",
        short: "Khám phá các giải pháp phục hình với tư vấn chuyên sâu.",
        detail:
          "Buổi tư vấn cấy ghép implant bắt đầu bằng việc lắng nghe, kiểm tra kỹ lưỡng và giải thích cặn kẽ các khả năng phục hồi răng.",
        benefits: [
          "Thăm khám, đánh giá cẩn trọng",
          "Giải thích chi tiết các phương án phục hình",
          "Thời gian thoải mái để đưa ra quyết định",
        ],
      },
      orthodontics: {
        title: "Chỉnh nha",
        short: "Định hướng cho nụ cười đều đặn và tự tin hơn.",
        detail:
          "Tư vấn chỉnh nha giúp bạn hiểu rõ các lựa chọn niềng răng và những điều cần biết trong suốt quá trình điều trị.",
        benefits: [
          "Đánh giá khởi đầu chuẩn xác",
          "Giải thích phương án đơn giản, dễ hiểu",
          "Lộ trình bám sát mục tiêu của bạn",
        ],
      },
      "childrens-dentistry": {
        title: "Nha khoa trẻ em",
        short: "Những lần khám nhẹ nhàng giúp nụ cười trẻ nhỏ phát triển khỏe mạnh.",
        detail:
          "Phương pháp tiếp cận nhẹ nhàng, phù hợp lứa tuổi giúp các bé hình thành thói quen tích cực với việc chăm sóc răng miệng.",
        benefits: [
          "Trải nghiệm đầu tiên thân thiện, vui vẻ",
          "Giải thích đơn giản giúp bé an tâm",
          "Luôn đồng hành và trao đổi cùng phụ huynh",
        ],
      },
    },
  },
  about: {
    ...en.about,
    eyebrow: "Về phòng khám",
    title: "Chăm sóc nụ cười nhẹ nhàng hơn",
    intro:
      "Nha Khoa Thịnh Hưng là một mô hình phòng khám mẫu chuyên nghiệp, tập trung vào giao tiếp rõ ràng, thăm khám tận tâm và tôn trọng từng bệnh nhân.",
    missionTitle: "Sứ mệnh",
    mission:
      "Giúp việc chăm sóc nha khoa dễ hiểu và thoải mái hơn, bắt đầu từ từng cuộc trò chuyện.",
    valuesTitle: "Giá trị cốt lõi",
    values: [
      {
        title: "Lắng nghe trước",
        text: "Dành thời gian cho câu hỏi, hoàn cảnh và ưu tiên riêng của bạn.",
      },
      {
        title: "Rõ ràng",
        text: "Giải thích các lựa chọn bằng ngôn ngữ dễ hiểu để bạn quyết định chủ động.",
      },
      {
        title: "Chăm sóc tận tâm",
        text: "Thiết kế mỗi lần thăm khám dựa trên sự tôn trọng, thoải mái và liên tục.",
      },
    ],
    environmentTitle: "Không gian thân thiện",
    environment:
      "Không gian phòng khám mẫu được hình dung sáng sủa, yên tĩnh và thiết thực, giúp bệnh nhân an tâm từ lúc đến cho đến sau buổi hẹn.",
    cta: "Bắt đầu trò chuyện",
  },
  doctors: {
    ...en.doctors,
    title: "Gặp gỡ đội ngũ chăm sóc",
    intro:
      "Tìm hiểu những người làm cho mỗi lần thăm khám trở nên chu đáo và riêng biệt.",
    practice: "Lĩnh vực thực hành",
    items: {
      "ngoc-hieu": {
        name: "Bác sĩ Ngọc Hiếu",
        specialty: "Nha khoa tổng quát",
        bio: "BS. Ngọc Hiếu tiếp cận chăm sóc nha khoa hằng ngày và giáo dục bệnh nhân một cách tận tâm, gần gũi.",
        areas: ["Chăm sóc dự phòng", "Tư vấn phục hồi", "Giáo dục bệnh nhân"],
      },
      "jordan-lee": {
        name: "Bác sĩ Jordan Lee",
        specialty: "Chỉnh nha",
        bio: "Jordan giúp bệnh nhân tìm hiểu về chỉnh nha với kỳ vọng rõ ràng và sự thoải mái được đặt lên hàng đầu.",
        areas: [
          "Tư vấn chỉnh nha",
          "Lập kế hoạch sắp xếp răng",
          "Chăm sóc gia đình",
        ],
      },
      "sam-taylor": {
        name: "Bác sĩ Sam Taylor",
        specialty: "Nha khoa trẻ em",
        bio: "Sam tập trung tạo trải nghiệm phù hợp lứa tuổi để các em tự tin hơn trong mỗi lần đến nha khoa.",
        areas: ["Khám cho trẻ", "Hướng dẫn dự phòng", "Trao đổi cùng gia đình"],
      },
    },
  },
  faq: {
    ...en.faq,
    title: "Giải đáp rõ ràng",
    intro:
      "Thông tin chung giúp bạn chuẩn bị tốt hơn. Bạn có thể trao đổi chi tiết với đội ngũ phòng khám.",
    items: {
      booking: [
        "Tôi có thể đặt lịch hẹn như thế nào?",
        "Bạn có thể sử dụng nút Đặt lịch hẹn trên trang web để gửi yêu cầu. Đội ngũ phòng khám sẽ liên hệ xác nhận trong thời gian sớm nhất.",
      ],
      checkups: [
        "Bao lâu nên khám răng định kỳ một lần?",
        "Bác sĩ nha khoa khuyến nghị nên khám định kỳ 6 tháng một lần tùy theo nhu cầu và tình trạng sức khỏe răng miệng của bạn.",
      ],
      cleaning: [
        "Điều gì diễn ra trong một buổi vệ sinh răng?",
        "Buổi vệ sinh răng chuyên nghiệp thường bao gồm kiểm tra tổng quát khoang miệng, lấy cao răng kỹ lưỡng và đánh bóng bề mặt răng.",
      ],
      whitening: [
        "Tẩy trắng răng có phù hợp với tôi không?",
        "Một buổi thăm khám sẽ giúp bác sĩ đánh giá tình trạng răng hiện tại và tư vấn phương pháp tẩy trắng phù hợp, an toàn nhất cho bạn.",
      ],
      braces: [
        "Tôi có thể tìm hiểu về niềng răng như thế nào?",
        "Thăm khám và chụp phim chỉnh nha là bước đầu tiên quan trọng để đánh giá độ lệch lạc của răng và lập kế hoạch niềng phù hợp.",
      ],
      children: [
        "Khi nào trẻ em nên bắt đầu đi khám răng?",
        "Phụ huynh nên đưa trẻ đến gặp bác sĩ nha khoa ngay khi chiếc răng sữa đầu tiên mọc hoặc vào khoảng 1 tuổi để tạo sự an tâm và thói quen tốt cho bé.",
      ],
      implants: [
        "Tôi nên biết những gì về cấy ghép Implant?",
        "Bác sĩ sẽ kiểm tra mật độ xương hàm, tư vấn các loại trụ phục hình và giải thích chi tiết các giai đoạn cấy ghép cần thiết.",
      ],
      duration: [
        "Một buổi hẹn khám thường kéo dài bao lâu?",
        "Thời gian một buổi khám thay đổi tùy theo dịch vụ, thông thường từ 30 đến 60 phút cho các dịch vụ chăm sóc thông thường.",
      ],
      bring: [
        "Tôi cần mang theo những gì khi đến khám?",
        "Bạn nên mang theo giấy tờ tùy thân, hồ sơ bệnh án hoặc phim chụp X-quang trước đó (nếu có) và danh sách thuốc đang sử dụng.",
      ],
      emergency: [
        "Tôi có thể liên hệ khi gặp vấn đề răng miệng khẩn cấp không?",
        "Hãy liên hệ ngay qua số hotline của phòng khám để đội ngũ bác sĩ kịp thời hướng dẫn xử lý và sắp xếp thời gian khám sớm nhất.",
      ],
    },
  },
  contact: {
    ...en.contact,
    title: "Hãy giữ liên lạc",
    intro:
      "Tìm phòng khám, liên hệ đội ngũ hoặc bắt đầu lên kế hoạch cho buổi thăm khám.",
    clinic: "Nha Khoa Thịnh Hưng",
    addressLabel: "Địa chỉ",
    address: "918 Âu Cơ, Tân Bình, Thành phố Hồ Chí Minh, Việt Nam",
    phoneLabel: "Điện thoại",
    phone: "+84 909 599 005",
    emailLabel: "Email",
    email: "nhakhoathinhhung@gmail.com",
    hoursLabel: "Giờ mở cửa",
    hours: "Thứ Hai–Chủ Nhật, 8:00–20:30",
    mapTitle: "Vị trí phòng khám",
    mapText:
      "Bản đồ mẫu. Có thể thêm liên kết vị trí khi địa chỉ phòng khám được xác nhận.",
    mapLink: "Mở bản đồ mẫu",
  },
  meta: {
    services: "Dịch vụ nha khoa | Nha Khoa Thịnh Hưng",
    about: "Về phòng khám | Nha Khoa Thịnh Hưng",
    doctors: "Đội ngũ bác sĩ | Nha Khoa Thịnh Hưng",
    faq: "Câu hỏi nha khoa | Nha Khoa Thịnh Hưng",
    contact: "Liên hệ phòng khám | Nha Khoa Thịnh Hưng",
    description:
      "Chăm sóc nha khoa tận tâm và thông tin rõ ràng từ Nha Khoa Thịnh Hưng.",
  },
};

export default publicPages;
