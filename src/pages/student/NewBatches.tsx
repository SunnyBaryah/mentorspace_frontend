import { motion } from "framer-motion";
import { useState, useRef } from "react";
import batchService from "@/services/batches";
import { Input } from "@/components/ui/input";
import type { Batch } from "@/interfaces/IBatch";
import { Skeleton } from "@/components/ui/skeleton";
import studentStore from "@/store/studentStore";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import searchIcon from "/search-icon.svg";
import transactionService from "@/services/transaction";
import { toast } from "react-toastify";

export default function NewBatches() {
  const { userData, addBatch } = studentStore();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const correctDateAndTimeForDisplay = (time: string) => {
    let localDate = new Date(time);
    return localDate.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const fetchBatches = async (query: string) => {
    try {
      setLoading(true);
      const res = await batchService.searchBatches(query);
      if (!res) return;
      const unboughtBatches = res.data.data.filter(
        (batch: Batch) =>
          Array.isArray(userData.enrolled_batches) &&
          !userData.enrolled_batches.includes(batch._id)
      );
      console.log(unboughtBatches);
      setBatches(unboughtBatches || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      if (e.target.value.trim() !== "") {
        fetchBatches(e.target.value.trim());
      } else {
        setBatches([]);
      }
    }, 1500);
  };

  // ✅ Payment handler
  const handlePayment = async (batch: Batch) => {
    try {
      setIsPaying(true);
      if (!batch.teacher_id) {
        console.log("No teacher id found for creating order!");
        return;
      }

      console.log(batch);

      // 1️⃣ Create Razorpay order
      const response = await transactionService.createOrder({
        amount: batch.price,
        studentId: userData.id,
        teacherId: batch.teacher_id,
        batchId: batch._id,
      });
      if (!response) return;

      const { orderId, amount, currency, transactionId, key, payment_status } =
        response.data.data;

      // 2️⃣ Open Razorpay Checkout
      const options = {
        key,
        amount: amount.toString(),
        currency,
        name: "MentorSpace",
        description: `Payment for ${batch.name}`,
        order_id: orderId,
        handler: async function (response: any) {
          // Payment successful
          const verifyRes = await transactionService.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            transactionId,
          });

          if (verifyRes?.data?.success) {
            addBatch(batch._id);
            toast.success("Payment successful! 🎉", {
              position: "bottom-center",
            });
          } else {
            toast.error("Payment verification failed.", {
              position: "bottom-center",
            });
          }
        },
        prefill: {
          name: userData.username,
          email: userData.email,
        },
        theme: { color: "#0f172a" },
        modal: {
          ondismiss: async function () {
            if (payment_status !== "cancelled")
              await transactionService.cancelOrder({ transactionId });
            console.log("Payment cancelled by user.");
          },
        },
      };

      const razor = new (window as any).Razorpay(options);

      razor.on("payment.failed", async function (response: any) {
        if (payment_status !== "cancelled")
          await transactionService.cancelOrder({ transactionId });
        console.log("Payment failed", response.error);
      });

      razor.open();
    } catch (err) {
      console.error("Payment initiation failed:", err);
      alert("Something went wrong while initiating payment.");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-dvh flex flex-col items-center gap-8 bg-gradient-to-br from-[#070F2B] to-[#535C91] pt-32 text-white"
    >
      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-4xl lg:text-5xl font-light text-center"
      >
        🔍 Search Batches
      </motion.h1>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex justify-between items-center w-11/12 md:w-3/5 lg:w-2/5 gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20"
      >
        <Input
          type="text"
          placeholder="Enter batch, topic, or teacher name..."
          value={searchTerm}
          onChange={handleChange}
          className="flex-grow bg-transparent border-none text-white placeholder:text-gray-300 focus-visible:ring-0"
        />
        <img
          src={searchIcon}
          className="h-[28px] cursor-pointer hover:scale-110 transition-transform"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-11/12 md:w-3/5 bg-lighter/90 backdrop-blur-lg border border-white/20 rounded-2xl pt-4 pb-6 px-6 shadow-lg"
      >
        {loading && (
          <div className="mt-10 space-y-4">
            <Skeleton className="bg-white/20 w-4/5 h-[40px] mx-auto" />
            <Skeleton className="bg-white/20 w-4/5 h-[40px] mx-auto" />
          </div>
        )}

        {batches.length > 0 ? (
          <div className="flex flex-col gap-3 w-full mx-auto">
            <div className="text-xl px-4 py-3 flex justify-between border-b border-white/20 font-semibold">
              <p>Batch</p>
              <p>Price</p>
            </div>

            {batches.map((batch: any, idx: number) => (
              <Dialog key={idx}>
                <DialogTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg text-white flex justify-between items-center cursor-pointer border border-white/10"
                  >
                    <span>{batch.name}</span>
                    <span className="text-green-400 font-medium">
                      ₹{batch.price}
                    </span>
                  </motion.div>
                </DialogTrigger>

                <DialogContent className="bg-[#0B1124] text-white border border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold text-center">
                      {batch.name}
                    </DialogTitle>
                    <DialogDescription className="mt-3 space-y-2 text-gray-300">
                      <p>
                        <strong>Teacher:</strong> {batch.teacher_name}
                      </p>
                      <p>
                        <strong>Price:</strong> ₹{batch.price}
                      </p>
                      <p>
                        <strong>Description:</strong> {batch.description}
                      </p>
                      <p>
                        <strong>Start Date:</strong>{" "}
                        {correctDateAndTimeForDisplay(batch.start_date)}
                      </p>
                      <p>
                        <strong>End Date:</strong>{" "}
                        {correctDateAndTimeForDisplay(batch.end_date)}
                      </p>
                    </DialogDescription>
                  </DialogHeader>

                  <DialogFooter className="mt-4">
                    <DialogClose>
                      <Button
                        className="bg-gradient-to-r from-[#1B1A55] to-[#535C91] hover:opacity-90 text-white"
                        onClick={() => handlePayment(batch)}
                        disabled={isPaying}
                      >
                        {isPaying ? "Processing..." : "Proceed to Payment"}
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        ) : (
          !loading && (
            <p className="text-gray-300 text-2xl text-center font-light pt-2">
              No batches found!
            </p>
          )
        )}
      </motion.div>
    </motion.div>
  );
}
