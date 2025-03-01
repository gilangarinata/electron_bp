"use client"

import { Button } from "../../app/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../../app/components/ui/form'
import { Input } from "../../app/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import Image from "next/image";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "../../app/components/ui/table"; // Importing the xlsx library
import * as XLSX from 'xlsx';
import Logo from '@/assets/pp_logo.png'

const formSchema = z.object({
	namaBarang: z.string().min(2, {
		message: "Nama barang setidaknya harus 2 karakter.",
	}),
	harga: z.string(),
	merk: z.string().min(1, {
		message: "Merk tidak boleh kosong.",
	}),
});

export default function Home() {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			namaBarang: "",
			harga: "",
			merk: "",
		},
	});

	const [openSuggestion, setOpenSuggestion] = useState(false)
	const [suggestions, setSuggestions] = useState<any[]>([]);

	useEffect(() => {
		// // Function to fetch suggestions from an Excel file
		// const fetchSuggestions = async () => {
		//     const response = await fetch('data_barang.xlsx'); // Adjust the path accordingly
		//     const data = await response.arrayBuffer();
		//     const workbook = XLSX.read(data);
		//     const worksheet = workbook.Sheets[workbook.SheetNames[0]];
		//     const jsonData = XLSX.utils.sheet_to_json(worksheet);
		//     const names = jsonData.map((item: any) => item.namaBarang); // Adjust the key based on your Excel structure
		//     setSuggestions(names);
		// };
		//
		// fetchSuggestions();
	}, []);

	const productName = form.watch("namaBarang");


	useEffect(() => {
		handleOnNameChange(productName)
	}, [productName]);


	const handleOnNameChange = async (v: string) => {
		await window.BloopAPI.getProduct(v);
	}

	useEffect(() => {
		window.BloopAPI.onProductAdded((response) => {
			if (response.success) {
				console.log('Product added successfully!');
				// Optionally, reset the form or provide user feedback
			}
		});

		window.BloopAPI.onGetProduct((response) => {
			console.log('Get product success');
			console.log(response)
			const suggestions = response?.map((r) => r.name) ?? []
			setSuggestions(response)
			if(suggestions.length > 0) {
				setOpenSuggestion(true)
			} else {
				setOpenSuggestion(false)
			}
		});

		window.BloopAPI.onGetAllProducts((response) => {
			console.log('Get All product success');
			console.log(response)
			const newWorkbook = XLSX.utils.book_new();
			const header = [
				["Nama Barang", "Harga", "Merk"], // Header r // Data row
			];

			const data = response?.map((p) => [p.name, p.price, p.brand]) ?? [];
			const newData = header.concat(data)

			console.log("DDDDD")
			console.log(newData)
			const newWorksheet = XLSX.utils.aoa_to_sheet(newData);
			XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Data");

			// Write the new workbook to a file and trigger download
			const date = new Date();
			const day = date.getDate();
			const month = date.toLocaleString('default', { month: 'long' }); // Get the full month name
			const year = date.getFullYear();
			const hours = date.getHours();
			const minutes = date.getMinutes();

			// Format the filename
			const fileName = `data_barang_${day}_${month}_${year}__${hours}_${minutes}.xlsx`;

			XLSX.writeFile(newWorkbook, fileName);
		});
	}, []);

	const handleDelete = (name: string) => {
		window.BloopAPI.deleteProduct(name);
		window.BloopAPI.getProduct(productName);
	}

	async function onSubmit(values: z.infer<typeof formSchema>) {

		// const dummyProducts = [];
		//
		// // Generate 50,000 dummy products
		// for (let i = 0; i < 70000; i++) {
		//     const product = {
		//         name: `${values.namaBarang} ${i + 1}`, // Unique name for each product
		//         price: values.harga + i, // Increment price for uniqueness
		//         brand: `${values.merk} Brand`, // Example brand
		//     };
		//     dummyProducts.push(product);
		// }
		//
		// // Send the array of dummy products to the Electron main process
		// for (const product of dummyProducts) {
		//     window.electronAPI.addProduct(product);
		// }
		//
		// console.log("50,000 dummy products added successfully!");

		const product = {
			name: values.namaBarang,
			price: values.harga,
			brand: values.merk,
		};

		form.reset();
		window.BloopAPI.addProduct(product);
	}

	return (
		<div className="mx-10 my-10">
			<Form {...form}>
				<div className="flex justify-center items-center w-full">
					<Image src={Logo} alt="Logo" width={150} height={150}/>
				</div>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
					<FormField
						control={form.control}
						name="namaBarang"
						render={({field}) => (
							<FormItem>
								<FormLabel>Nama Barang</FormLabel>
								<FormControl>
									<Input
										placeholder=""
										{...field}
										list="suggestions"
									/>


								</FormControl>
								<FormDescription>
									Nama barang tidak boleh sama dengan yang sudah di input sebelumnya
								</FormDescription>
								<FormMessage/>
							</FormItem>
						)}
					/>
					{openSuggestion && (
						<div className="grid gap-4 px-20">
							<div className="space-y-2">
								<h4 className="font-medium leading-none">Barang Di Database</h4>
							</div>
							<div className="grid gap-2">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-[100px]">Nama</TableHead>
											<TableHead>Merk</TableHead>
											<TableHead>Harga</TableHead>
											<TableHead></TableHead>

										</TableRow>
									</TableHeader>
									<TableBody>
										{suggestions.map((invoice) => (
											<TableRow key={invoice}>
												<TableCell className="font-medium">{invoice.name}</TableCell>
												<TableCell>{invoice.brand}</TableCell>
												<TableCell>{invoice.price}</TableCell>
												<TableCell onClick={() => handleDelete(invoice.name)} className="hover:cursor-pointer text-red-300">Hapus</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</div>
					)}

					<FormField
						control={form.control}
						name="harga"
						render={({field}) => (
							<FormItem>
								<FormLabel>Harga</FormLabel>
								<FormControl>
									<Input type="number" placeholder="" {...field} />
								</FormControl>
								<FormMessage/>
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="merk"
						render={({field}) => (
							<FormItem>
								<FormLabel>Merk</FormLabel>
								<FormControl>
									<Input placeholder="" {...field} />
								</FormControl>
								<FormMessage/>
							</FormItem>
						)}
					/>
					<Button type="submit" className="mr-3 hover:cursor-pointer">Simpan</Button>
					<Button onClick={() => window.BloopAPI.getAllProducts()} className="mr-3 hover:cursor-pointer">Simpan Ke Excel</Button>
				</form>
			</Form>
		</div>
	);
}
