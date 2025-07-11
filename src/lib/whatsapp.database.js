import config from "../../config.js"
import mongoose from "mongoose"
import fs from "fs"
import path from "path"
mongoose.set("strictQuery", false)

class MongoDB {
    constructor(url) {
        this.url = url || config.options.URI
        this.options = {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
        this.model = { database: {} }
        this.data = {}
    }

    async read() {
        await mongoose.connect(this.url, this.options)
        try {
            const schema = new mongoose.Schema({
                data: { type: Object, required: true, default: {} }
            })
            this.model.database = mongoose.model("data", schema)
        } catch {
            this.model.database = mongoose.model("data")
        }
        this.data = await this.model.database.findOne({})
        if (!this.data) {
            await new this.model.database({ data: {} }).save()
            this.data = await this.model.database.findOne({})
        }
        return this.data?.data || {}
    }

    async write(data) {
        const obj = data || global.db
        if (!this.data?.data) {
            await new this.model.database({ data: obj }).save()
        } else {
            const doc = await this.model.database.findById(this.data._id)
            doc.data = obj
            await doc.save()
        }
    }
}

class JSONDatabase {
    constructor() {
        this.data = {}
        this.file = path.join(process.cwd(), "temp", config.options.URI)
    }

    read() {
        if (fs.existsSync(this.file)) {
            this.data = JSON.parse(fs.readFileSync(this.file))
        } else {
            fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2))
        }
        return this.data
    }

    write(data) {
        this.data = data || global.db
        const dir = path.dirname(this.file)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2))
    }
}

// 🔄 Unified export
const Database = /mongo/.test(config.options.URI) ? MongoDB : JSONDatabase
export default Database
