// Uses SC's script-recompiler; emits structure/entry metadata only, never script payloads.
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.*;
import org.json.*;
import org.legendofdragoon.scripting.*;
import org.legendofdragoon.scripting.meta.*;
import org.legendofdragoon.scripting.tokens.*;

class ExportEffectScripts {
  public static void main(String[] args) throws Exception {
    Path sc = Path.of(args[0]);
    var meta = new MetaManager(null, sc.resolve("patches")).loadMeta("meta");
    var disassembler = new Disassembler(meta);
    var output = new JSONObject();
    for (String path : Files.readAllLines(Path.of(args[1]))) {
      if (path.isBlank()) continue;
      byte[] bytes = Files.readAllBytes(sc.resolve("files").resolve(path));
      try {
        var script = disassembler.disassemble(path, bytes, List.of(), Map.of());
        var offsets = new JSONArray();
        var starts = new JSONObject();
        for (var entry : script.entries) {
          if (!(entry instanceof Op op)) continue;
          offsets.put(op.address);
          if (op.type == OpType.CALL && op.headerParam == 605 && op.params.length == 2 && op.params[1].resolvedValue.isPresent()) {
            String flags = Integer.toUnsignedString(op.params[1].resolvedValue.get());
            if (!starts.has(flags)) starts.put(flags, new JSONArray());
            starts.getJSONArray(flags).put(op.address);
          }
        }
        output.put(path, new JSONObject().put("offsets", offsets).put("starts", starts)
          .put("entrypoints", new JSONArray(script.allEntrypoints))
          .put("sha256", HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes))));
      } catch (RuntimeException failure) {
        output.put(path, new JSONObject().put("error", failure.toString()));
      }
    }
    Files.writeString(Path.of(args[2]), output.toString());
  }
}
