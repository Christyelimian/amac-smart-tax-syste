import { motion } from "framer-motion";
import { Zap, Shield, Smartphone, Receipt, CreditCard, BadgeCheck } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant",
    description: "Payment confirmed in seconds with real-time status updates",
  },
  {
    icon: Shield,
    title: "Secure",
    description: "Bank-grade encryption protects all your transactions",
  },
  {
    icon: Smartphone,
    title: "Convenient",
    description: "Pay from anywhere using your phone, tablet, or computer",
  },
  {
    icon: Receipt,
    title: "Auto-Receipt",
    description: "Instant email and SMS receipt delivery after payment",
  },
  {
    icon: CreditCard,
    title: "Multiple Methods",
    description: "Pay with Card, Bank Transfer, USSD, or Mobile App",
  },
  {
    icon: BadgeCheck,
    title: "Official",
    description: "Authorized government platform with verified payments",
  },
];

const WhyPayWithUs = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Why Pay With Us?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience hassle-free payments with our secure and convenient platform.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-6 md:p-8"
            >
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary/10 flex items-center justify-center">
                <feature.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyPayWithUs;
