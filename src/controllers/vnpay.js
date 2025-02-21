import dotenv from "dotenv";
import crypto from "crypto";
import querystring from "qs";
import moment from "moment";
dotenv.config();
process.env.TZ = "Asia/Ho_Chi_Minh";

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

const checkoutVnpay = {
  payment: async (req, res) => {
    // data body send request
    let date = new Date();
    let createDate = moment(date).format("YYYYMMDDHHmmss");

    try {
      const { total_price, user_id } = req.body;
      const secretKey = process.env.VNP_HASHSECRET;
      let vnpUrl = process.env.VNP_URL;
      const ip =
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

      const amount = total_price;
      // kiểm tra nếu giá tiền dưới 5k thì k đc
      if (amount < 5000) {
        return res.status(500).json({
          message: "Minimum amount is 5000 VND  ",
        });
      }

      let vnp_Params = {};
      vnp_Params["vnp_Version"] = "2.1.0";
      vnp_Params["vnp_Command"] = "pay";
      vnp_Params["vnp_TmnCode"] = process.env.VNP_TMNCODE;
      vnp_Params["vnp_Amount"] = amount * 100;
      // vnp_Params["vnp_BankCode"] = "NCB";
      vnp_Params["vnp_CreateDate"] = createDate;
      vnp_Params["vnp_CurrCode"] = "VND";
      vnp_Params["vnp_IpAddr"] = ip;
      vnp_Params["vnp_Locale"] = "vn";
      vnp_Params["vnp_OrderInfo"] = "Thanh_toan_don_hang";
      vnp_Params[
        "vnp_ReturnUrl"
      ] = `https://fsneaker.id.vn/checkout?userId=${user_id}&expire=${moment(
        new Date()
      )
        .add(15, "minute")
        .toDate()
        .getTime()}`;
      const vnp_TxnRef = moment(new Date()).format("DDHHmmss");
      vnp_Params["vnp_TxnRef"] = vnp_TxnRef; // Số hóa đơn
      vnp_Params["vnp_OrderType"] = "other";
      vnp_Params = sortObject(vnp_Params);
      const signData = querystring.stringify(vnp_Params, { encode: false });
      const hmac = crypto.createHmac("sha512", secretKey);
      const signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
      vnp_Params["vnp_SecureHash"] = signed;
      vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

      return res.status(200).json({ url: vnpUrl, vnp_TxnRef }); // Trả về thông tin thanh toán
    } catch (error) {
      res.status(200).json({ message: "Error server" });
    }
  },

  checkPaymentForVNPay2(req, res, next) {
    var vnp_Params = req.query;

    var secureHash = vnp_Params["vnp_SecureHash"];
    console.log(secureHash);

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);

    var tmnCode = process.env.VNP_TMNCODE;
    var secretKey = process.env.VNP_HASHSECRET;

    var signData = querystring.stringify(vnp_Params, { encode: false });

    var hmac = crypto.createHmac("sha512", secretKey);
    var signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
    console.log(signed);
    var orderId = vnp_Params["vnp_TxnRef"];
    var rspCode = vnp_Params["vnp_ResponseCode"];
    if (secureHash === signed) {
      res
        .status(200)
        .json({ RspCode: rspCode, Message: "success", orderId, rspCode });
    } else {
      res.status(200).json({ RspCode: rspCode, Message: "Fail checksum" });
    }
  },
  checkPaymentForVNPay(req, res, next) {
    console.log(req.query);
    let vnp_Params = req.query;
    const secretKey = process.env.VNP_HASHSECRET;

    const secureHash = vnp_Params["vnp_SecureHash"];
    console.log(secureHash, "secureHash");

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);

    vnp_Params = sortObject(vnp_Params);
    const signData = querystring.stringify(vnp_Params, { encode: false });
    console.log(secretKey, "dfdsfa", signData);
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

    console.log("signed", signed);
    var orderId = vnp_Params["vnp_TxnRef"];
    var rspCode = vnp_Params["vnp_ResponseCode"];
    if (secureHash === signed) {
      return res
        .status(200)
        .json({ RspCode: "00", Message: "success", orderId, rspCode });
    } else {
      return res
        .status(200)
        .json({ orderId, rspCode, RspCode: "97", Message: "Fail checksum" });
    }
  },
};

export default checkoutVnpay;