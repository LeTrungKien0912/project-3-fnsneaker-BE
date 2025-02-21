// utils/email.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "Gmail", // Bạn có thể sử dụng các dịch vụ khác như Yahoo, Outlook...
  auth: {
    user: process.env.EMAIL_USER, // Email của bạn
    pass: process.env.EMAIL_PASS, // Mật khẩu ứng dụng email
  },
});
const statusTranslations = {
  pending: "Chờ xác nhận",
  waiting: "Đã xác nhận",
  delivering: "Đang giao hàng",
  done: "Giao hàng thành công",
  cancel: "Đã hủy",
};

const statusColors = {
  pending: "#f39c12", // Vàng
  waiting: "#3498db", // Xanh dương
  delivering: "#f1c40f", // Vàng nhạt
  done: "#2ecc71", // Xanh lá
  cancel: "#e74c3c", // Đỏ
};

const translateStatus = (status) => {
  return statusTranslations[status] || status;
};

export const sendOrderConfirmationEmail = (to, order) => {
  // Tạo nội dung HTML cho email với thông tin sản phẩm
  const productDetailsHtml = order.productDetails
    .map(
      (product) => `
    <div>
      <p>Tên sản phẩm: <strong>${product.productName}</strong></p>
      <p>Kích thước: <strong>${product.sizeName}</strong></p>
      <p>Số lượng đặt hàng: <strong>${product.quantityOrders}</strong></p>
    </div>
  `
    )
    .join("");

  const mailOptions = {
    from: `"Fsneaker Shop" <${process.env.EMAIL_USER}>`,
    to: to, // Gửi email đến người đặt hàng
    subject: `Xác nhận đơn hàng #${order.codeOrders}`,
    text: `Cảm ơn bạn đã đặt hàng!`,
    html: `<h1>Cảm ơn bạn đã đặt hàng!</h1>
           <p>Đơn hàng của bạn có mã: <strong>${order.codeOrders}</strong>.</p>
           
           <div>
           ${productDetailsHtml}
           </div>
               <p>Tổng giá trị đơn hàng: <strong>${order.total_price}</strong>.</p>
             
           </table>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};

export const sendOrderStatusUpdateEmail = (to, order, newStatus) => {
  const translatedStatus = translateStatus(newStatus);
  const statusColor = statusColors[newStatus] || "#000000"; // Mặc định màu đen nếu không có màu tương ứng
  // Tạo nội dung HTML cho email với thông tin sản phẩm
  const productDetailsHtml = order.productDetails
    .map(
      (product) => `
    <div>
      <p>Tên sản phẩm: <strong>${product.productName}</strong></p>
      <p>Kích thước: <strong>${product.sizeName}</strong></p>
      <p>Số lượng đặt hàng: <strong>${product.quantityOrders}</strong></p>
    </div>
  `
    )
    .join("");
  const mailOptions = {
    from: `"Fsneaker Shop" <${process.env.EMAIL_USER}>`,
    to: to, // Email của khách hàng
    subject: `Cập nhật trạng thái đơn hàng #${order.codeOrders}`,
    text: `Đơn hàng của bạn có mã:  đã được cập nhật trạng thái: ${translatedStatus}.`,
    html: `<h2>Cập nhật trạng thái đơn hàng!</h2>
           <p>Đơn hàng của bạn có mã: <strong>${order.codeOrders}</strong></p> 
           <p>Trạng thái: <strong style="color: ${statusColor};">${translatedStatus}</strong>.</p>
           <div>
           ${productDetailsHtml}
           </div>
           <p>Tổng giá trị đơn hàng: <strong>${order.total_price}</strong>.</p>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};


export const sendNewPasswordEmail = (to, newPassword) => {
  const mailOptions = {
    from: `"Fsneaker Shop" <${process.env.EMAIL_USER}>`,
    to: to, // Gửi email đến người dùng
    subject: `Mật khẩu mới của bạn`,
    text: `Mật khẩu mới của bạn là: ${newPassword}`,
    html: `<h1>Mật khẩu mới của bạn</h1>
           <p>Mật khẩu mới của bạn là: <strong>${newPassword}</strong></p>
           <span>Vui lòng thay đổi mật khẩu ngay khi nhận được mật khẩu mới này để tránh kẻ gian có thể truy cập vào tài khoản của bạn</span>
           `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};