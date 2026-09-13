import legend.game.tmd.TmdWithId;
import legend.game.unpacker.FileData;
import java.nio.file.*;
import java.io.*;

/** CPU-only bridge using SC's own TMD decoder. Output is consumed by render_guides.py. */
class ExportWorldMapMesh {
  static int u16(byte[] b, int p) { return (b[p] & 255) | (b[p + 1] & 255) << 8; }
  public static void main(String[] args) throws Exception {
    var tmd = new TmdWithId("terrain", new FileData(Files.readAllBytes(Path.of(args[0]))));
    try(var out = new DataOutputStream(new BufferedOutputStream(Files.newOutputStream(Path.of(args[1]))))) {
      for(int part = 0; part < tmd.tmd.objTable.length; part++) {
        var obj = tmd.tmd.objTable[part];
        for(var primitive : obj.primitives_10) {
          int mode = primitive.header() >>> 24;
          boolean quad = (mode & 8) != 0, textured = (mode & 4) != 0;
          boolean gouraud = (mode & 16) != 0, lit = (mode & 1) == 0;
          boolean shaded = (primitive.header() & 0x40000) != 0;
          int count = quad ? 4 : 3;
          for(var packet : primitive.data()) {
            int p = 0, clut = 0, tpage = 0;
            int[] u = new int[count], v = new int[count], colour = new int[count];
            java.util.Arrays.fill(colour, 0x808080);
            if(textured) for(int i = 0; i < count; i++) {
              u[i] = packet[p++] & 255; v[i] = packet[p++] & 255;
              if(i == 0) clut = u16(packet, p);
              if(i == 1) tpage = u16(packet, p);
              p += 2;
            }
            if(shaded || !lit) for(int i = 0; i < count; i++, p += 4) colour[i] = u16(packet, p) | (packet[p + 2] & 255) << 16;
            else if(!textured) {
              java.util.Arrays.fill(colour, u16(packet, p) | (packet[p + 2] & 255) << 16); p += 4;
            }
            out.writeInt(count); out.writeInt(textured ? tpage : -1); out.writeInt(clut); out.writeInt(part | ((mode & 2) != 0 ? 0x10000 : 0));
            for(int i = 0; i < count; i++) {
              if(lit && (gouraud || i == 0)) p += 2;
              var point = obj.vert_top_00[u16(packet, p)]; p += 2;
              out.writeFloat(point.x); out.writeFloat(point.y); out.writeFloat(point.z);
              out.writeInt(u[i]); out.writeInt(v[i]); out.writeInt(colour[i]);
            }
          }
        }
      }
    }
  }
}
