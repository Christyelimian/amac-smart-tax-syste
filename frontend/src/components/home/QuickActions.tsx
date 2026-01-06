import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileSearch, Download, Bell, MessageCircle } from "lucide-react";

const actions = [
  {
    icon: FileSearch,
    title: "Check Payment Status",
    description: "Track your payment in real-time",
    href: "/check-status",
    color: "bg-info/10 text-info",
  },
  {
    icon: Download,
    title: "Download Receipt",
    description: "Get a copy of your receipt anytime",
    href: "/receipt",
    color: "bg-success/10 text-success",
  },
  {
    icon: Bell,
    title: "Set Payment Reminder",
    description: "Never miss a payment deadline",
    href: "/reminders",
    color: "bg-warning/10 text-warning",
  },
  {
    icon: MessageCircle,
    title: "Contact Support",
    description: "We're here to help 24/7",
    href: "/support",
    color: "bg-primary/10 text-primary",
  },
];

const QuickActions = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Quick Actions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage your payments and get support with just a click.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {actions.map((action, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={action.href}
                className="group block p-6 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-xl ${action.color} flex items-center justify-center mb-4`}>
                  <action.icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickActions;
