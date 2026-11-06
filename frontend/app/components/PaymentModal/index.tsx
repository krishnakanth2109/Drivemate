import React from "react";
import { View } from "react-native";

interface PaymentModalProps {
  visible?: boolean;
  onClose?: () => void;
  onPaymentSuccess?: (plan: any) => void;
  freePostsUsed?: number;
}

const PaymentModal: React.FC<PaymentModalProps> = () => {
  return <View />;
};

export default PaymentModal;
