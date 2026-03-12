import { CheckCircle2, Package, Truck, Home } from "lucide-react";

export type OrderStatus = "Confirmed" | "Preparing" | "Out for Delivery" | "Delivered";

interface OrderTrackingTimelineProps {
    currentStatus: OrderStatus;
}

const steps = [
    { id: "Confirmed", icon: CheckCircle2, label: "Confirmed" },
    { id: "Preparing", icon: Package, label: "Preparing" },
    { id: "Out for Delivery", icon: Truck, label: "Out for Delivery" },
    { id: "Delivered", icon: Home, label: "Delivered" },
];

const OrderTrackingTimeline = ({ currentStatus }: OrderTrackingTimelineProps) => {
    const currentIndex = steps.findIndex((step) => step.id === currentStatus);

    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between relative">
                {/* Connecting line */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10 rounded-full" />
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-500"
                    style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, index) => {
                    const isActive = index <= currentIndex;
                    const isCurrent = index === currentIndex;
                    const StepIcon = step.icon;

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-2 relative bg-background px-2">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${isActive
                                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                                        : "bg-muted text-muted-foreground"
                                    } ${isCurrent ? "ring-4 ring-primary/20 scale-110" : ""}`}
                            >
                                <StepIcon className="w-5 h-5" />
                            </div>
                            <span
                                className={`text-xs md:text-sm font-medium absolute -bottom-8 w-24 text-center ${isActive ? "text-foreground" : "text-muted-foreground"
                                    }`}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OrderTrackingTimeline;
