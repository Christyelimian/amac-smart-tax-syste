import { motion } from "framer-motion";
import { Phone, MessageCircle, Mail, Clock } from "lucide-react";
import { Button } from "../ui/button";

const SupportCTA = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-8 md:p-12 text-primary-foreground relative overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.4%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
          </div>

          <div className="relative z-10 text-center mb-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
              Need Help?
            </h2>
            <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto">
              Our support team is ready to assist you with any questions or issues.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-5 text-center">
              <Phone className="w-8 h-8 mx-auto mb-3" />
              <p className="font-semibold mb-1">Call Us</p>
              <p className="text-sm text-primary-foreground/80">0800-AMAC-PAY</p>
            </div>

            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-5 text-center">
              <MessageCircle className="w-8 h-8 mx-auto mb-3" />
              <p className="font-semibold mb-1">WhatsApp</p>
              <p className="text-sm text-primary-foreground/80">+234 803 123 4567</p>
            </div>

            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-5 text-center">
              <Mail className="w-8 h-8 mx-auto mb-3" />
              <p className="font-semibold mb-1">Email</p>
              <p className="text-sm text-primary-foreground/80">support@amacpay.ng</p>
            </div>

            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-5 text-center">
              <Clock className="w-8 h-8 mx-auto mb-3" />
              <p className="font-semibold mb-1">Hours</p>
              <p className="text-sm text-primary-foreground/80">Mon-Fri, 8AM-6PM</p>
            </div>
          </div>

          <div className="relative z-10 text-center mt-8">
            <Button
              variant="secondary"
              size="lg"
              className="rounded-xl shadow-lg"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Start Live Chat
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SupportCTA;
